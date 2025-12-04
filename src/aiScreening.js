/**
 * AI-Powered Candidate Screening & Evaluation Engine
 * Provides algorithms for candidate scoring, auto-selection, and analytics
 */

// Scoring weights for different criteria
const SCORING_WEIGHTS = {
  educationMatch: 0.20,
  experienceMatch: 0.25,
  skillsMatch: 0.25,
  certificationsMatch: 0.10,
  interviewPerformance: 0.15,
  cultureAlignment: 0.05,
};

/**
 * Calculate AI Score for a candidate against job requirements
 * Returns score (0-100) and breakdown by category
 */
export function calculateCandidateScore(candidate, jobRequirements) {
  const scores = {
    educationMatch: scoreEducation(candidate, jobRequirements),
    experienceMatch: scoreExperience(candidate, jobRequirements),
    skillsMatch: scoreSkills(candidate, jobRequirements),
    certificationsMatch: scoreCertifications(candidate, jobRequirements),
    interviewPerformance: candidate.interviewScore || 0,
    cultureAlignment: scoreCultureFit(candidate),
  };

  const totalScore = Object.entries(scores).reduce((sum, [key, value]) => {
    return sum + (value * (SCORING_WEIGHTS[key] || 0));
  }, 0);

  return {
    totalScore: Math.round(totalScore),
    breakdown: scores,
    weights: SCORING_WEIGHTS,
  };
}

function scoreEducation(candidate, requirements) {
  const required = requirements?.education?.required || 'Bachelor';
  const candidateDegree = (candidate.degree || '').toLowerCase();

  const degreeHierarchy = {
    'high school': 1,
    'diploma': 1,
    'bachelor': 2,
    'master': 3,
    'phd': 4,
  };

  const requiredLevel = degreeHierarchy[required.toLowerCase()] || 2;
  const candidateLevel = Object.entries(degreeHierarchy).find(
    ([degree]) => candidateDegree.includes(degree.toLowerCase())
  )?.[1] || 0;

  return Math.min((candidateLevel / requiredLevel) * 100, 100);
}

function scoreExperience(candidate, requirements) {
  const required = requirements?.experience?.minYears || 0;
  const candidateYears = Number(candidate.experienceYears) || 0;

  if (candidateYears === 0 && required > 0) return 0;
  if (candidateYears >= required * 1.5) return 100; // Exceeds by 50%+
  return Math.min((candidateYears / required) * 100, 100);
}

function scoreSkills(candidate, requirements) {
  const requiredSkills = requirements?.skills?.required || [];
  if (requiredSkills.length === 0) return 100;

  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const matched = requiredSkills.filter(skill =>
    candidateSkills.some(cs => cs.includes(skill.toLowerCase()))
  ).length;

  return (matched / requiredSkills.length) * 100;
}

function scoreCertifications(candidate, requirements) {
  const required = requirements?.certifications?.required || [];
  if (required.length === 0) return 100;

  const candidateCerts = (candidate.certifications || []).map(c => c.toLowerCase());
  const matched = required.filter(cert =>
    candidateCerts.some(cc => cc.includes(cert.toLowerCase()))
  ).length;

  return (matched / required.length) * 100;
}

function scoreCultureFit(candidate) {
  // Simple heuristic: presence of soft skills mentions, communication quality, LinkedIn presence
  const cultureIndicators = [
    candidate.linkedin?.length > 0,
    candidate.address?.length > 0,
    candidate.phone?.length > 0,
  ];
  return (cultureIndicators.filter(Boolean).length / cultureIndicators.length) * 100;
}

/**
 * Auto-select candidates based on score threshold
 * Returns list of candidates with auto-selection recommendation
 */
export function autoSelectCandidates(candidates, jobRequirements, threshold = 75) {
  return candidates
    .map(candidate => {
      const scoreResult = calculateCandidateScore(candidate, jobRequirements);
      return {
        ...candidate,
        aiScore: scoreResult.totalScore,
        scoreBreakdown: scoreResult.breakdown,
        autoSelected: scoreResult.totalScore >= threshold,
        recommendation:
          scoreResult.totalScore >= threshold
            ? 'RECOMMEND - Schedule Interview'
            : scoreResult.totalScore >= 60
            ? 'REVIEW - Consider for screening'
            : 'HOLD - Below threshold',
      };
    })
    .sort((a, b) => b.aiScore - a.aiScore);
}

/**
 * Generate hiring analytics and insights
 */
export function generateAnalytics(state) {
  const jobs = state.jobs || [];
  const applications = state.applications || [];
  const shortlists = state.shortlists || [];

  const analytics = {
    totalApplications: applications.length,
    submittedApplications: applications.filter(a => a.status === 'submitted').length,
    screenedApplications: applications.filter(a => a.status === 'screening').length,
    interviewApplications: applications.filter(a =>
      ['phone-interview', 'interview'].includes(a.status)
    ).length,
    offeredApplications: applications.filter(a => a.status === 'offer').length,
    rejectedApplications: applications.filter(a => a.status === 'rejected').length,
    totalJobs: jobs.length,
    openJobs: jobs.filter(j => j.status === 'open').length,
    totalShortlists: shortlists.length,

    // Conversion rates
    conversionRates: {
      applicationToInterview: applications.length > 0
        ? Math.round(
          (applications.filter(a => ['phone-interview', 'interview'].includes(a.status))
            .length / applications.length) * 100
        )
        : 0,
      applicationToOffer: applications.length > 0
        ? Math.round((applications.filter(a => a.status === 'offer').length / applications.length) * 100)
        : 0,
      screeningToInterview: applications.filter(a => a.status === 'screening').length > 0
        ? Math.round(
          (applications.filter(a => ['phone-interview', 'interview'].includes(a.status)).length /
            applications.filter(a => a.status === 'screening').length) *
            100
        )
        : 0,
    },

    // Time to hire (in days)
    timeToHireStats: calculateTimeToHire(applications),

    // Top performing jobs
    jobPerformance: jobs.map(job => {
      const jobApps = applications.filter(a => a.jobId === job.id);
      const offers = jobApps.filter(a => a.status === 'offer');
      return {
        jobId: job.id,
        title: job.title,
        totalApplications: jobApps.length,
        offers: offers.length,
        averageScore: jobApps.length > 0
          ? Math.round(
            jobApps.reduce((sum, a) => sum + (a.aiScore || 0), 0) / jobApps.length
          )
          : 0,
      };
    }),

    // Hiring funnel
    hiringFunnel: {
      applications: applications.length,
      screened: applications.filter(a => a.status !== 'submitted').length,
      interviewed: applications.filter(a =>
        ['phone-interview', 'interview'].includes(a.status)
      ).length,
      offers: applications.filter(a => a.status === 'offer').length,
    },
  };

  return analytics;
}

function calculateTimeToHire(applications) {
  const offeredApps = applications.filter(a => a.status === 'offer' && a.createdAt);
  if (offeredApps.length === 0) {
    return { average: 0, min: 0, max: 0 };
  }

  const daysToHire = offeredApps.map(app => {
    const created = new Date(app.createdAt);
    const now = new Date();
    return Math.floor((now - created) / (1000 * 60 * 60 * 24));
  });

  return {
    average: Math.round(daysToHire.reduce((a, b) => a + b) / daysToHire.length),
    min: Math.min(...daysToHire),
    max: Math.max(...daysToHire),
  };
}

/**
 * Generate evaluation rubric for interview scoring
 */
export const EVALUATION_RUBRIC = {
  technical: {
    label: 'Technical Skills',
    weight: 0.40,
    criteria: [
      'Relevant knowledge and expertise',
      'Problem-solving ability',
      'Technical communication clarity',
    ],
  },
  communication: {
    label: 'Communication & Collaboration',
    weight: 0.25,
    criteria: [
      'Articulate and clear expression',
      'Active listening',
      'Team collaboration mindset',
    ],
  },
  experience: {
    label: 'Relevant Experience',
    weight: 0.20,
    criteria: [
      'Project/role relevance',
      'Growth trajectory',
      'Achievement highlights',
    ],
  },
  cultureFit: {
    label: 'Culture Fit & Motivation',
    weight: 0.15,
    criteria: [
      'Alignment with company values',
      'Career goal alignment',
      'Enthusiasm and commitment',
    ],
  },
};

/**
 * Calculate interview evaluation score (1-10 per rubric, weighted)
 */
export function calculateInterviewScore(evaluationData) {
  let totalScore = 0;
  let totalWeight = 0;

  Object.entries(EVALUATION_RUBRIC).forEach(([key, rubric]) => {
    const categoryScore = evaluationData[key] || 5; // Default mid-range
    totalScore += categoryScore * rubric.weight;
    totalWeight += rubric.weight;
  });

  return Math.round((totalScore / totalWeight) * 10);
}

/**
 * Generate hiring report summary
 */
export function generateHiringReport(state) {
  const analytics = generateAnalytics(state);

  const report = {
    title: 'Hiring Pipeline Report',
    generatedAt: new Date().toISOString(),
    period: 'Current Cycle',
    executive_summary: {
      total_applications: analytics.totalApplications,
      open_positions: analytics.openJobs,
      offers_extended: analytics.offeredApplications,
      average_time_to_hire: `${analytics.timeToHireStats.average} days`,
    },
    key_metrics: {
      application_to_interview_rate: `${analytics.conversionRates.applicationToInterview}%`,
      interview_to_offer_rate: `${analytics.conversionRates.screeningToInterview}%`,
      overall_offer_rate: `${analytics.conversionRates.applicationToOffer}%`,
    },
    hiring_funnel: analytics.hiringFunnel,
    top_jobs: analytics.jobPerformance
      .sort((a, b) => b.totalApplications - a.totalApplications)
      .slice(0, 5),
    recommendations: generateRecommendations(analytics),
  };

  return report;
}

function generateRecommendations(analytics) {
  const recommendations = [];

  if (analytics.conversionRates.applicationToInterview < 10) {
    recommendations.push('⚠️ Low screening conversion rate. Review screening criteria.');
  }
  if (analytics.timeToHireStats.average > 30) {
    recommendations.push('⚠️ High time-to-hire. Consider streamlining interview process.');
  }
  if (analytics.offeredApplications === 0 && analytics.totalApplications > 10) {
    recommendations.push('⚠️ No offers yet despite high volume. Review job requirements or candidate fit.');
  }
  if (analytics.openJobs > 5) {
    recommendations.push('✓ Multiple open positions. Consider accelerated hiring.');
  }
  if (analytics.totalApplications === 0) {
    recommendations.push('📢 No applications yet. Boost job promotion.');
  }

  return recommendations;
}

/**
 * Export report data to CSV format
 */
export function reportToCSV(report) {
  const lines = [
    report.title,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    '',
    'EXECUTIVE SUMMARY',
    Object.entries(report.executive_summary)
      .map(([k, v]) => `${k},${v}`)
      .join('\n'),
    '',
    'KEY METRICS',
    Object.entries(report.key_metrics)
      .map(([k, v]) => `${k},${v}`)
      .join('\n'),
    '',
    'HIRING FUNNEL',
    Object.entries(report.hiring_funnel)
      .map(([k, v]) => `${k},${v}`)
      .join('\n'),
  ];

  return lines.join('\n');
}
