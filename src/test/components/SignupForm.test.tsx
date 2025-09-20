import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignupForm } from '../../components/SignupForm';
import { UnifiedAuthProvider } from '../../contexts/UnifiedAuthContext';

// Mock the onClose function
const mockOnClose = vi.fn();

// Mock the UnifiedAuthContext
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();

vi.mock('../../contexts/UnifiedAuthContext', () => ({
  useUnifiedAuth: () => ({
    signUp: mockSignUp,
    signIn: mockSignIn,
    user: null,
    loading: false,
  }),
  UnifiedAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSignupForm = () => {
    return render(
      <UnifiedAuthProvider>
        <SignupForm onClose={mockOnClose} />
      </UnifiedAuthProvider>
    );
  };

  describe('Form Rendering', () => {
    it('renders the signup form with all required fields', () => {
      renderSignupForm();

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Account Type/i)).toBeInTheDocument();
    });

    it('shows age verification checkbox', () => {
      renderSignupForm();

      expect(screen.getByLabelText(/I am 18 years or older/i)).toBeInTheDocument();
    });

    it('shows terms and conditions checkbox', () => {
      renderSignupForm();

      expect(screen.getByLabelText(/I agree to follow the Terms and Conditions/i)).toBeInTheDocument();
    });

    it('has a link to terms and conditions page', () => {
      renderSignupForm();

      const termsLink = screen.getByText('Terms and Conditions');
      expect(termsLink).toHaveAttribute('href', '/terms');
      expect(termsLink).toHaveAttribute('target', '_blank');
    });
  });

  describe('Form Validation', () => {
    it('requires age verification', async () => {
      renderSignupForm();

      // Fill out form without checking age verification
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByLabelText(/I agree to follow the Terms and Conditions/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText(/You must be 18 years or older to create an account/i)).toBeInTheDocument();
      });
    });

    it('requires terms acceptance', async () => {
      renderSignupForm();

      // Fill out form without checking terms
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByLabelText(/I am 18 years or older/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText(/You must accept the Terms and Conditions to create an account/i)).toBeInTheDocument();
      });
    });

    it('validates password strength', async () => {
      renderSignupForm();

      // Fill out form with weak password
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'weak' } });
      fireEvent.click(screen.getByLabelText(/I am 18 years or older/i));
      fireEvent.click(screen.getByLabelText(/I agree to follow the Terms and Conditions/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText(/Password does not meet requirements/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Type Selection', () => {
    it('shows producer fields when producer is selected', () => {
      renderSignupForm();

      const accountTypeSelect = screen.getByLabelText(/Account Type/i);
      fireEvent.change(accountTypeSelect, { target: { value: 'producer' } });

      expect(screen.getByLabelText(/Producer Invitation Code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/IPI Number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Performing Rights Organization/i)).toBeInTheDocument();
    });

    it('shows artist fields when artist_band is selected', () => {
      renderSignupForm();

      const accountTypeSelect = screen.getByLabelText(/Account Type/i);
      fireEvent.change(accountTypeSelect, { target: { value: 'artist_band' } });

      expect(screen.getByLabelText(/Artist Invitation Code/i)).toBeInTheDocument();
    });

    it('does not show invitation fields for client accounts', () => {
      renderSignupForm();

      const accountTypeSelect = screen.getByLabelText(/Account Type/i);
      fireEvent.change(accountTypeSelect, { target: { value: 'client' } });

      expect(screen.queryByLabelText(/Invitation Code/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid client data', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockSignIn.mockResolvedValue({ error: null });

      renderSignupForm();

      // Fill out form with valid data
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByLabelText(/I am 18 years or older/i));
      fireEvent.click(screen.getByLabelText(/I agree to follow the Terms and Conditions/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('john@example.com', 'Password123!');
      });
    });

    it('shows loading state during submission', async () => {
      mockSignUp.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderSignupForm();

      // Fill out form
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByLabelText(/I am 18 years or older/i));
      fireEvent.click(screen.getByLabelText(/I agree to follow the Terms and Conditions/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
    });

    it('shows success message after successful submission', async () => {
      mockSignUp.mockResolvedValue({ error: null });
      mockSignIn.mockResolvedValue({ error: null });

      renderSignupForm();

      // Fill out form
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByLabelText(/I am 18 years or older/i));
      fireEvent.click(screen.getByLabelText(/I agree to follow the Terms and Conditions/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText('✅ Account Created!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when signup fails', async () => {
      mockSignUp.mockResolvedValue({ error: { message: 'Email already exists' } });

      renderSignupForm();

      // Fill out form
      fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'john@example.com' } });
      fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'Password123!' } });
      fireEvent.click(screen.getByLabelText(/I am 18 years or older/i));
      fireEvent.click(screen.getByLabelText(/I agree to follow the Terms and Conditions/i));

      // Submit form
      fireEvent.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      renderSignupForm();

      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
