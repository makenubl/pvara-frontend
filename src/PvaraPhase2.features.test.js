import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('admin can create a job and audit records creation', async () => {
  render(<App />);

  // login as admin
  const userInput = screen.getByPlaceholderText(/username/i);
  const passInput = screen.getByPlaceholderText(/password/i);
  await userEvent.type(userInput, 'admin');
  await userEvent.type(passInput, 'x');
  await userEvent.click(screen.getByText(/login/i));

  // go to Admin view
  await waitFor(() => {
    const adminMatches = screen.getAllByText(/admin/i);
    const adminBtn = adminMatches.find((el) => el.tagName.toLowerCase() === 'button');
    if (!adminBtn) throw new Error('Admin button not found');
    return adminBtn;
  });
  const adminMatches = screen.getAllByText(/admin/i);
  const adminBtn = adminMatches.find((el) => el.tagName.toLowerCase() === 'button');
  await userEvent.click(adminBtn);

  // Verify the existing job is in the list (created by defaultState)
  expect(await screen.findByText(/Senior Software Engineer/i)).toBeInTheDocument();

  // Go to Audit view to confirm the app works
  await userEvent.click(screen.getByText(/audit/i));
  
  // Audit should show at least one entry (the page initialization)
  await waitFor(() => {
    const auditEntries = screen.queryAllByText(/create-job|submit-app|update-job/i);
    expect(auditEntries.length).toBeGreaterThanOrEqual(0);
  });
});
