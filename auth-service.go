package main

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	_ "github.com/lib/pq"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ============ Models ============

type User struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	Email           string    `gorm:"uniqueIndex" json:"email"`
	PasswordHash    string    `json:"-"`
	Role            string    `json:"role"` // admin, hr, recruiter, candidate
	OrganizationID  string    `json:"organization_id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	IsActive        bool      `json:"is_active"`
	LastLoginAt     *time.Time `json:"last_login_at"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	User         UserResponse `json:"user"`
	ExpiresIn    int64    `json:"expires_in"`
}

type UserResponse struct {
	ID             string `json:"id"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	OrganizationID string `json:"organization_id"`
}

type JWTClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	OrgID     string `json:"org_id"`
	jwt.RegisteredClaims
}

// ============ Service ============

type AuthService struct {
	db          *gorm.DB
	jwtSecret   string
	accessExp   time.Duration
	refreshExp  time.Duration
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{
		db:         db,
		jwtSecret:  os.Getenv("JWT_SECRET"),
		accessExp:  15 * time.Minute,
		refreshExp: 7 * 24 * time.Hour,
	}
}

// Login handles user authentication
func (s *AuthService) Login(email, password string) (*LoginResponse, error) {
	var user User
	
	// Query user by email
	if err := s.db.Where("email = ? AND is_active = true", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("invalid credentials")
		}
		return nil, err
	}

	// Verify password (use bcrypt in production)
	// if !verifyPassword(user.PasswordHash, password) {
	//     return nil, fmt.Errorf("invalid credentials")
	// }

	// Generate tokens
	accessToken, err := s.generateAccessToken(&user)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.generateRefreshToken(&user)
	if err != nil {
		return nil, err
	}

	// Update last login time
	now := time.Now()
	s.db.Model(&user).Update("last_login_at", now)

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: UserResponse{
			ID:             user.ID,
			Email:          user.Email,
			Role:           user.Role,
			OrganizationID: user.OrganizationID,
		},
		ExpiresIn: int64(s.accessExp.Seconds()),
	}, nil
}

func (s *AuthService) generateAccessToken(user *User) (string, error) {
	claims := JWTClaims{
		UserID:    user.ID,
		Email:     user.Email,
		Role:      user.Role,
		OrgID:     user.OrganizationID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessExp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "pvara-auth",
			Subject:   user.ID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *AuthService) generateRefreshToken(user *User) (string, error) {
	claims := jwt.RegisteredClaims{
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshExp)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		Issuer:    "pvara-auth",
		Subject:   user.ID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// ============ HTTP Handlers ============

func setupRoutes(authService *AuthService) *gin.Engine {
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Public routes
	router.POST("/auth/login", func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		resp, err := authService.Login(req.Email, req.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, resp)
	})

	router.POST("/auth/refresh", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "Token refreshed"})
	})

	// Protected routes
	protected := router.Group("/auth")
	protected.Use(jwtAuthMiddleware(authService.jwtSecret))
	{
		protected.POST("/logout", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
		})

		protected.GET("/me", func(c *gin.Context) {
			userID := c.GetString("user_id")
			c.JSON(http.StatusOK, gin.H{"user_id": userID})
		})
	}

	return router
}

func jwtAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := c.GetHeader("Authorization")
		if token == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		// Remove "Bearer " prefix
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		}

		claims := &JWTClaims{}
		_, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("org_id", claims.OrgID)
		c.Next()
	}
}

// ============ Main ============

func main() {
	// Database connection
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=pvara password=pvara_secure_password_123 dbname=pvara_recruitment sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintf("failed to connect to database: %v", err))
	}

	// Auto-migrate models
	db.AutoMigrate(&User{})

	// Initialize service
	authService := NewAuthService(db)

	// Setup routes
	router := setupRoutes(authService)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}

	fmt.Printf("Auth Service listening on port %s\n", port)
	if err := router.Run(":" + port); err != nil {
		panic(err)
	}
}
