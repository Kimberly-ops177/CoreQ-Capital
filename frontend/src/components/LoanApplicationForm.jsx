import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  Divider,
  AppBar,
  Toolbar,
  CircularProgress
} from '@mui/material';
import { ArrowBack, ArrowForward, Save, Calculate, Print } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const steps = ['Borrower Information', 'Collateral Details', 'Loan Terms', 'Review & Generate'];

const LoanApplicationForm = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editLoanId = searchParams.get('edit');
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [createdLoanId, setCreatedLoanId] = useState(null);
  const [interestRates, setInterestRates] = useState({});
  const [businessRules, setBusinessRules] = useState({});
  const [loanCalculation, setLoanCalculation] = useState(null);

  // Second-time borrower tracking
  const [borrowerHistory, setBorrowerHistory] = useState(null);
  const [isSecondTimeBorrower, setIsSecondTimeBorrower] = useState(false);
  const [checkingBorrower, setCheckingBorrower] = useState(false);

  // Borrower Data
  const [borrowerData, setBorrowerData] = useState({
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    email: '',
    location: '',
    apartment: '',
    houseNumber: '',
    isStudent: false,
    institution: '',
    registrationNumber: '',
    emergencyNumber: ''
  });

  // Collateral Data
  const [collateralData, setCollateralData] = useState({
    category: '',
    itemName: '',
    modelNumber: '',
    serialNumber: '',
    itemCondition: 'Good'
  });

  // Loan Data
  const [loanData, setLoanData] = useState({
    amountIssued: '',
    loanPeriod: '',
    customLoanPeriod: '',
    dateIssued: new Date().toISOString().split('T')[0],
    interestRate: '',
    isNegotiable: false
  });

  useEffect(() => {
    fetchInterestRates();
  }, []);

  // Load loan data if in edit mode
  useEffect(() => {
    if (editLoanId) {
      loadLoanData(editLoanId);
    }
  }, [editLoanId]);

  const loadLoanData = async (loanId) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/loan-applications/agreements`);
      const loan = res.data.find(l => l.id === parseInt(loanId));

      if (!loan) {
        setError('Loan not found');
        return;
      }

      // Check if loan can be edited
      if (loan.agreementStatus !== 'pending_upload') {
        setError('This loan cannot be edited');
        return;
      }

      // Populate borrower data
      setBorrowerData({
        fullName: loan.borrower?.fullName || '',
        idNumber: loan.borrower?.idNumber || '',
        phoneNumber: loan.borrower?.phoneNumber || '',
        email: loan.borrower?.email || '',
        location: loan.borrower?.location || '',
        apartment: loan.borrower?.apartment || '',
        houseNumber: loan.borrower?.houseNumber || '',
        isStudent: loan.borrower?.isStudent || false,
        institution: loan.borrower?.institution || '',
        registrationNumber: loan.borrower?.registrationNumber || '',
        emergencyNumber: loan.borrower?.emergencyNumber || ''
      });

      // Populate collateral data
      setCollateralData({
        itemName: loan.collateral?.itemName || '',
        category: loan.collateral?.category || '',
        serialNumber: loan.collateral?.serialNumber || '',
        estimatedValue: loan.collateral?.estimatedValue || '',
        condition: loan.collateral?.condition || '',
        description: loan.collateral?.description || ''
      });

      // Populate loan data
      setLoanData({
        amountIssued: loan.amountIssued || '',
        dateIssued: loan.dateIssued ? new Date(loan.dateIssued).toISOString().split('T')[0] : '',
        loanPeriod: loan.loanPeriod || '',
        interestRate: loan.interestRate || '',
        isNegotiable: loan.isNegotiable || false
      });

      setIsEditMode(true);
      setCreatedLoanId(loan.id);
    } catch (err) {
      console.error('Error loading loan data:', err);
      setError(err.response?.data?.error || 'Failed to load loan data');
    } finally {
      setLoading(false);
    }
  };

  // Check if borrower exists and get their loan history
  const checkBorrowerHistory = async (idNumber) => {
    if (!idNumber || idNumber.length < 5) {
      setBorrowerHistory(null);
      setIsSecondTimeBorrower(false);
      return;
    }

    try {
      setCheckingBorrower(true);
      const res = await axios.get(`/api/loan-applications/check-borrower/${idNumber}`);

      if (res.data.exists && res.data.isSecondTimeBorrower) {
        setBorrowerHistory(res.data);
        setIsSecondTimeBorrower(true);

        // Pre-fill borrower data if exists
        if (res.data.borrower) {
          setBorrowerData(prev => ({
            ...prev,
            fullName: res.data.borrower.fullName || prev.fullName,
            phoneNumber: res.data.borrower.phoneNumber || prev.phoneNumber,
            email: res.data.borrower.email || prev.email,
            location: res.data.borrower.location || prev.location,
            apartment: res.data.borrower.apartment || prev.apartment,
            houseNumber: res.data.borrower.houseNumber || prev.houseNumber,
            isStudent: res.data.borrower.isStudent || prev.isStudent,
            institution: res.data.borrower.institution || prev.institution,
            registrationNumber: res.data.borrower.registrationNumber || prev.registrationNumber,
            emergencyNumber: res.data.borrower.emergencyNumber || prev.emergencyNumber
          }));
        }

        // Make loan negotiable for second-time borrowers
        setLoanData(prev => ({ ...prev, isNegotiable: true }));
      } else {
        setBorrowerHistory(null);
        setIsSecondTimeBorrower(false);
      }
    } catch (err) {
      console.error('Error checking borrower:', err);
      setBorrowerHistory(null);
      setIsSecondTimeBorrower(false);
    } finally {
      setCheckingBorrower(false);
    }
  };

  // Check borrower when ID number changes
  useEffect(() => {
    if (borrowerData.idNumber && !isEditMode) {
      const timeoutId = setTimeout(() => {
        checkBorrowerHistory(borrowerData.idNumber);
      }, 500); // Debounce to avoid too many API calls
      return () => clearTimeout(timeoutId);
    }
  }, [borrowerData.idNumber, isEditMode]);

  // Check if loan is negotiable based on amount OR second-time borrower status
  useEffect(() => {
    if (loanData.amountIssued) {
      const amount = parseFloat(loanData.amountIssued);

      // Check if negotiable (>50k OR second-time borrower)
      if (amount > (businessRules.negotiableThreshold || 50000) || isSecondTimeBorrower) {
        setLoanData(prev => ({ ...prev, isNegotiable: true }));
      } else {
        setLoanData(prev => ({
          ...prev,
          isNegotiable: false,
          interestRate: ''
        }));
      }
    }
  }, [loanData.amountIssued, businessRules, isSecondTimeBorrower]);

  // Auto-calculate loan terms
  useEffect(() => {
    if (loanData.amountIssued && loanData.loanPeriod) {
      const amount = parseFloat(loanData.amountIssued);
      const period = parseInt(loanData.loanPeriod);

      // Set default interest rate if not negotiable
      if (!loanData.isNegotiable) {
        setLoanData(prev => ({
          ...prev,
          interestRate: interestRates[period] || ''
        }));
      }

      // Calculate preview
      const rate = loanData.isNegotiable && loanData.interestRate
        ? parseFloat(loanData.interestRate)
        : interestRates[period];

      if (rate) {
        const interestAmount = amount * (rate / 100);
        const totalAmount = amount + interestAmount;

        setLoanCalculation({
          principal: amount,
          interestRate: rate,
          interestAmount: interestAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          period: `${period} week(s)`
        });
      }
    }
  }, [loanData.amountIssued, loanData.loanPeriod, loanData.interestRate, loanData.isNegotiable, interestRates]);

  const fetchInterestRates = async () => {
    try {
      const res = await axios.get('/api/loans/interest-rates');
      setInterestRates(res.data.standardRates);
      setBusinessRules(res.data.rules);
    } catch (err) {
      console.error('Error fetching interest rates:', err);
    }
  };

  const validateStep = () => {
    setError(null);

    if (activeStep === 0) {
      if (!borrowerData.fullName || !borrowerData.phoneNumber || !borrowerData.location) {
        setError('Please fill in all required borrower fields');
        return false;
      }
      if (borrowerData.isStudent && (!borrowerData.institution || !borrowerData.registrationNumber)) {
        setError('Please provide institution and registration number for students');
        return false;
      }
    }

    if (activeStep === 1) {
      if (!collateralData.category || !collateralData.itemName || !collateralData.itemCondition) {
        setError('Please fill in all required collateral fields');
        return false;
      }
    }

    if (activeStep === 2) {
      if (!loanData.amountIssued || !loanData.loanPeriod || !loanData.dateIssued) {
        setError('Please fill in all required loan fields');
        return false;
      }
      const amount = parseFloat(loanData.amountIssued);
      const period = parseInt(loanData.loanPeriod);

      if (period === 4 && amount < (businessRules.minAmountFor4Weeks || 12000)) {
        setError(`4-week loans require minimum KSH ${(businessRules.minAmountFor4Weeks || 12000).toLocaleString()}`);
        return false;
      }

      if (loanData.isNegotiable && !loanData.interestRate) {
        setError('Please set a custom interest rate for this negotiable loan');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        borrower: borrowerData,
        collateral: collateralData,
        loan: {
          amountIssued: parseFloat(loanData.amountIssued),
          loanPeriod: parseInt(loanData.loanPeriod),
          dateIssued: loanData.dateIssued,
          isNegotiable: loanData.isNegotiable,
          interestRate: loanData.isNegotiable ? parseFloat(loanData.interestRate) : undefined
        }
      };

      if (isEditMode) {
        // Update existing loan
        const res = await axios.put(`/api/loan-applications/${createdLoanId}`, payload);
        setSuccess(
          `Loan application updated successfully!\n\n` +
          `Loan ID: #${createdLoanId}\n` +
          `Borrower: ${borrowerData.fullName}\n` +
          `Amount: KSH ${parseFloat(loanData.amountIssued).toLocaleString()}\n` +
          `Total Due: KSH ${loanCalculation.totalAmount}\n\n` +
          `The loan agreement has been regenerated with the updated information.`
        );
      } else {
        // Create new loan
        const res = await axios.post('/api/loan-applications', payload);
        setCreatedLoanId(res.data.loan.id);
        setSuccess(
          `Loan application created successfully!\n\n` +
          `Loan ID: #${res.data.loan.id}\n` +
          `Borrower: ${borrowerData.fullName}\n` +
          `Amount: KSH ${parseFloat(loanData.amountIssued).toLocaleString()}\n` +
          `Total Due: KSH ${loanCalculation.totalAmount}\n\n` +
          `Click the button below to download the loan agreement, print it, and have it signed by the borrower.`
        );
      }

    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} loan application:`, err);
      setError(err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} loan application`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Borrower Information</Typography>
            </Grid>

            {/* Second-time borrower welcome banner */}
            {checkingBorrower && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<CircularProgress size={20} />}>
                  Checking borrower history...
                </Alert>
              </Grid>
            )}

            {isSecondTimeBorrower && borrowerHistory && (
              <Grid item xs={12}>
                <Alert
                  severity="success"
                  sx={{
                    backgroundColor: '#e8f5e9',
                    border: '2px solid #4caf50'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Welcome Back! 🎉
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>{borrowerHistory.borrower.fullName}</strong> - You're a valued customer!
                  </Typography>
                  <Typography variant="body2">
                    • Loan History: {borrowerHistory.loanHistory.loansRepaid} loan(s) successfully repaid
                    {borrowerHistory.loanHistory.tier === 'silver' && ' (Returning Customer)'}
                    {borrowerHistory.loanHistory.tier === 'gold' && ' (Valued Customer) ⭐'}
                    {borrowerHistory.loanHistory.loansDefaulted > 0 && ' (Previous defaults: ' + borrowerHistory.loanHistory.loansDefaulted + ')'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2e7d32', mt: 1 }}>
                    ✓ Special Benefit: Interest rates and repayment period are <strong>negotiable</strong> for all your loans!
                  </Typography>
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Full Name"
                value={borrowerData.fullName}
                onChange={(e) => setBorrowerData({...borrowerData, fullName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID Number"
                value={borrowerData.idNumber}
                onChange={(e) => setBorrowerData({...borrowerData, idNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Phone Number"
                value={borrowerData.phoneNumber}
                onChange={(e) => setBorrowerData({...borrowerData, phoneNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={borrowerData.email}
                onChange={(e) => setBorrowerData({...borrowerData, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                label="Location"
                value={borrowerData.location}
                onChange={(e) => setBorrowerData({...borrowerData, location: e.target.value.toUpperCase()})}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Apartment/Estate"
                value={borrowerData.apartment}
                onChange={(e) => setBorrowerData({...borrowerData, apartment: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="House Number"
                value={borrowerData.houseNumber}
                onChange={(e) => setBorrowerData({...borrowerData, houseNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={borrowerData.isStudent}
                    onChange={(e) => setBorrowerData({...borrowerData, isStudent: e.target.checked})}
                  />
                }
                label="Is Student?"
              />
            </Grid>
            {borrowerData.isStudent && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Institution"
                    value={borrowerData.institution}
                    onChange={(e) => setBorrowerData({...borrowerData, institution: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Registration Number"
                    value={borrowerData.registrationNumber}
                    onChange={(e) => setBorrowerData({...borrowerData, registrationNumber: e.target.value})}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Emergency Contact Number"
                value={borrowerData.emergencyNumber}
                onChange={(e) => setBorrowerData({...borrowerData, emergencyNumber: e.target.value})}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Collateral Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={collateralData.category}
                  label="Category"
                  onChange={(e) => setCollateralData({...collateralData, category: e.target.value})}
                >
                  <MenuItem value="Electronics">Electronics</MenuItem>
                  <MenuItem value="Jewelry">Jewelry</MenuItem>
                  <MenuItem value="Furniture">Furniture</MenuItem>
                  <MenuItem value="Appliances">Appliances</MenuItem>
                  <MenuItem value="Vehicles">Vehicles</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="Item Name"
                value={collateralData.itemName}
                onChange={(e) => setCollateralData({...collateralData, itemName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model Number"
                value={collateralData.modelNumber}
                onChange={(e) => setCollateralData({...collateralData, modelNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={collateralData.serialNumber}
                onChange={(e) => setCollateralData({...collateralData, serialNumber: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Item Condition</InputLabel>
                <Select
                  value={collateralData.itemCondition}
                  label="Item Condition"
                  onChange={(e) => setCollateralData({...collateralData, itemCondition: e.target.value})}
                >
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Loan Terms</Typography>
            </Grid>

            {/* Interest Rate Info */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Standard Interest Rates</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="body2">1 Week: {interestRates[1]}%</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">2 Weeks: {interestRates[2]}%</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">3 Weeks: {interestRates[3]}%</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">4 Weeks: {interestRates[4]}%</Typography>
                    </Grid>
                  </Grid>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    • 4-week loans require minimum KSH {(businessRules.minAmountFor4Weeks || 12000).toLocaleString()}<br />
                    • Loans above KSH {(businessRules.negotiableThreshold || 50000).toLocaleString()} have negotiable terms
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="number"
                label="Amount to Issue (KSH)"
                value={loanData.amountIssued}
                onChange={(e) => setLoanData({...loanData, amountIssued: e.target.value})}
                inputProps={{
                  min: 0,
                  step: 0.01,
                  style: { fontSize: '1rem' }
                }}
              />
            </Grid>

            {loanData.isNegotiable && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {isSecondTimeBorrower ? (
                    <>
                      🎉 <strong>Negotiable Terms!</strong> As a returning customer, you can negotiate both the interest rate and repayment period for this loan. Set your custom terms below.
                    </>
                  ) : (
                    <>
                      💡 This loan amount exceeds KSH {(businessRules.negotiableThreshold || 50000).toLocaleString()} and has negotiable terms. You can set a custom interest rate and period below.
                    </>
                  )}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                type="date"
                label="Date Issued"
                value={loanData.dateIssued}
                onChange={(e) => setLoanData({...loanData, dateIssued: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {!loanData.isNegotiable && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Loan Period</InputLabel>
                  <Select
                    value={loanData.loanPeriod}
                    label="Loan Period"
                    onChange={(e) => setLoanData({...loanData, loanPeriod: e.target.value})}
                  >
                    <MenuItem value={1}>1 Week ({interestRates[1]}% interest)</MenuItem>
                    <MenuItem value={2}>2 Weeks ({interestRates[2]}% interest)</MenuItem>
                    <MenuItem value={3}>3 Weeks ({interestRates[3]}% interest)</MenuItem>
                    <MenuItem value={4}>4 Weeks ({interestRates[4]}% interest)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            {loanData.isNegotiable && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Custom Loan Period (Weeks)"
                    value={loanData.customLoanPeriod}
                    onChange={(e) => setLoanData({...loanData, customLoanPeriod: e.target.value, loanPeriod: e.target.value})}
                    helperText="Enter custom loan period in weeks"
                    inputProps={{ min: 1, step: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    step="0.01"
                    label="Custom Interest Rate (%)"
                    value={loanData.interestRate}
                    onChange={(e) => setLoanData({...loanData, interestRate: e.target.value})}
                    helperText="Enter custom interest rate for this negotiable loan"
                  />
                </Grid>
              </>
            )}

            {/* Loan Calculation Preview */}
            {loanCalculation && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Calculate sx={{ mr: 1 }} /> Loan Calculation
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Principal:</strong></Typography>
                        <Typography variant="h6" color="primary">KSH {parseFloat(loanCalculation.principal).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Interest Rate:</strong></Typography>
                        <Typography variant="h6">{loanCalculation.interestRate}%</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Interest Amount:</strong></Typography>
                        <Typography variant="h6">KSH {parseFloat(loanCalculation.interestAmount).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2"><strong>Total Due:</strong></Typography>
                        <Typography variant="h6" color="success.main">KSH {parseFloat(loanCalculation.totalAmount).toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Loan Application</Typography>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom><strong>Borrower Information</strong></Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="body2">Name:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{borrowerData.fullName}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Phone:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{borrowerData.phoneNumber}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Location:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{borrowerData.location}</Typography></Grid>
                  {borrowerData.isStudent && (
                    <>
                      <Grid item xs={6}><Typography variant="body2">Institution:</Typography></Grid>
                      <Grid item xs={6}><Typography variant="body2">{borrowerData.institution}</Typography></Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom><strong>Collateral Details</strong></Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="body2">Category:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{collateralData.category}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Item:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{collateralData.itemName}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Condition:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{collateralData.itemCondition}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom><strong>Loan Terms</strong></Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}><Typography variant="body2">Amount Issued:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2" color="primary"><strong>KSH {parseFloat(loanData.amountIssued).toLocaleString()}</strong></Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Interest Rate:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{loanCalculation?.interestRate}%</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Loan Period:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">{loanData.loanPeriod} week(s)</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2">Total Amount Due:</Typography></Grid>
                  <Grid item xs={6}><Typography variant="h6" color="success.main">KSH {loanCalculation?.totalAmount}</Typography></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Core Q Capital - {isEditMode ? 'Edit' : 'New'} Loan Application
          </Typography>
          <Button color="inherit" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/employee')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                {success.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<Print />}
                  onClick={async () => {
                    try {
                      const response = await axios.get(`/api/loan-applications/${createdLoanId}/download-agreement`, {
                        responseType: 'blob'
                      });
                      // Create blob with correct PDF MIME type
                      const blob = new Blob([response.data], { type: 'application/pdf' });
                      const url = window.URL.createObjectURL(blob);

                      // Open in new window for printing
                      const printWindow = window.open(url, '_blank');
                      if (printWindow) {
                        printWindow.onload = () => {
                          printWindow.print();
                          // Clean up the URL after a delay
                          setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                        };
                      } else {
                        // Fallback: download the PDF if popup blocked
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `Loan_Agreement_${createdLoanId}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      }
                    } catch (err) {
                      console.error('Error printing agreement:', err);
                      setError('Failed to print agreement');
                    }
                  }}
                >
                  Print Agreement
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => navigate('/loan-agreements')}
                >
                  Go to Loan Agreements
                </Button>
              </Box>
            </>
          )}

          {!success && (
            <>
              <Box sx={{ mb: 4 }}>
                {renderStepContent(activeStep)}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                    >
                      {loading
                        ? (isEditMode ? 'Updating...' : 'Creating...')
                        : (isEditMode ? 'Update Loan Application' : 'Create Loan Application')
                      }
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      endIcon={<ArrowForward />}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default LoanApplicationForm;
