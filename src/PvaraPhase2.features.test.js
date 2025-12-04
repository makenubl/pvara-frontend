import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

  // go to Admin
  // nav may contain multiple 'admin' texts (role label etc.), pick the button element
  const adminMatches = screen.getAllByText(/admin/i);
  const adminBtn = adminMatches.find((el) => el.tagName.toLowerCase() === 'button');
  await userEvent.click(adminBtn);

  // fill job form
  const titleInput = screen.getByPlaceholderText(/title/i);
  const deptInput = screen.getByPlaceholderText(/department/i);
  fireEvent.change(titleInput, { target: { value: 'Test Role' } });
  fireEvent.change(deptInput, { target: { value: 'QA' } });
  await userEvent.click(screen.getByRole('button', { name: /create job/i }));

  // job should appear in the list
  expect(await screen.findByText(/Test Role/i)).toBeInTheDocument();

  // check audit view shows create-job action
  await userEvent.click(screen.getByText(/audit/i));
  await waitFor(() => expect(screen.getAllByText(/create-job/i).length).toBeGreaterThan(0));
});
