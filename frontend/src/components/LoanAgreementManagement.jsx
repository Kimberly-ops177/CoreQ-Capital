import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  AppBar,
  Toolbar,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton
} from '@mui/material';
import { Upload, CheckCircle, Cancel, Download, Visibility } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoanAgreementManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Reject dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchLoans();
  }, [filter]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/loans');

      let filteredLoans = res.data.data || res.data;
      if (filter !== 'all') {
        filteredLoans = filteredLoans.filter(loan => loan.agreementStatus === filter);
      }

      setLoans(filteredLoans);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError(err.response?.data?.error || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_upload':
        return 'warning';
      case 'pending_approval':
        return 'info';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_upload':
        return '🟠';
      case 'pending_approval':
        return '🔵';
      case 'approved':
        return '🟢';
      case 'rejected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const formatStatus = (status) => {
    if (!status || status === 'pending_upload') return 'Pending Upload';
    if (status === 'pending_approval') return 'Pending Approval';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return status;
  };

  // Upload handlers
  const handleUploadClick = (loan) => {
    setSelectedLoan(loan);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, JPG, and PNG files are allowed');
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('signedAgreement', selectedFile);

      await axios.post(`/api/loan-agreements/${selectedLoan.id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Agreement uploaded successfully! Waiting for admin approval.');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      fetchLoans();
    } catch (err) {
      console.error('Error uploading agreement:', err);
      setError(err.response?.data?.error || 'Failed to upload agreement');
    } finally {
      setUploading(false);
    }
  };

  // Approve handler
  const handleApprove = async (loan) => {
    if (!window.confirm(`Are you sure you want to approve the agreement for loan #${loan.id}?`)) {
      return;
    }

    try {
      setError(null);
      await axios.post(`/api/loan-agreements/${loan.id}/approve`, {
        notes: 'Approved by admin'
      });

      setSuccess('Agreement approved successfully!');
      fetchLoans();
    } catch (err) {
      console.error('Error approving agreement:', err);
      setError(err.response?.data?.error || 'Failed to approve agreement');
    }
  };

  // Reject handlers
  const handleRejectClick = (loan) => {
    setSelectedLoan(loan);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setError(null);
      await axios.post(`/api/loan-agreements/${selectedLoan.id}/reject`, {
        reason: rejectReason
      });

      setSuccess('Agreement rejected. Employee will be notified.');
      setRejectDialogOpen(false);
      setRejectReason('');
      fetchLoans();
    } catch (err) {
      console.error('Error rejecting agreement:', err);
      setError(err.response?.data?.error || 'Failed to reject agreement');
    }
  };

  // Download handler
  const handleDownload = async (loan) => {
    try {
      const response = await axios.get(`/api/loan-agreements/${loan.id}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `loan_${loan.id}_agreement.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading agreement:', err);
      setError(err.response?.data?.error || 'Failed to download agreement');
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
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Core Q Capital - Loan Agreements
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button color="inherit" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/employee')}>Dashboard</Button>
            <Button color="inherit" onClick={() => navigate('/borrowers')}>Borrowers</Button>
            <Button color="inherit" onClick={() => navigate('/loans')}>Loans</Button>
            <Button color="inherit" onClick={() => navigate('/collaterals')}>Collaterals</Button>
            <Button color="inherit" onClick={() => navigate('/expenses')}>Expenses</Button>
            {user.role === 'admin' && <Button color="inherit" onClick={() => navigate('/settings')}>Settings</Button>}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loan Agreement Management
        </Typography>

        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Manage signed loan agreements with upload, approval, and download functionality.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Filter by Status</InputLabel>
              <Select value={filter} label="Filter by Status" onChange={(e) => setFilter(e.target.value)}>
                <MenuItem value="all">All Loans</MenuItem>
                <MenuItem value="pending_upload">🟠 Pending Upload</MenuItem>
                <MenuItem value="pending_approval">🔵 Pending Approval</MenuItem>
                <MenuItem value="approved">🟢 Approved</MenuItem>
                <MenuItem value="rejected">🔴 Rejected</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Loan ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Borrower</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Agreement Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No loans found</TableCell>
                  </TableRow>
                ) : (
                  loans.map((loan) => {
                    const status = loan.agreementStatus || 'pending_upload';
                    const canUpload = status === 'pending_upload' || status === 'rejected';
                    const canApprove = user.role === 'admin' && status === 'pending_approval';
                    const canReject = user.role === 'admin' && status === 'pending_approval';
                    const canDownload = status === 'approved' || (user.role === 'admin' && (status === 'pending_approval' || status === 'rejected'));

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>#{loan.id}</TableCell>
                        <TableCell>{loan.borrower?.fullName || 'N/A'}</TableCell>
                        <TableCell>KSH {parseFloat(loan.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${getStatusIcon(status)} ${formatStatus(status)}`}
                            color={getStatusColor(status)}
                            size="small"
                          />
                          {status === 'rejected' && loan.agreementNotes && (
                            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                              Reason: {loan.agreementNotes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {canUpload && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                startIcon={<Upload />}
                                onClick={() => handleUploadClick(loan)}
                              >
                                Upload
                              </Button>
                            )}

                            {canApprove && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleApprove(loan)}
                              >
                                Approve
                              </Button>
                            )}

                            {canReject && (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => handleRejectClick(loan)}
                              >
                                Reject
                              </Button>
                            )}

                            {canDownload && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Download />}
                                onClick={() => handleDownload(loan)}
                              >
                                Download
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Signed Agreement</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Loan ID:</strong> #{selectedLoan.id}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Borrower:</strong> {selectedLoan.borrower?.fullName || 'N/A'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Amount:</strong> KSH {parseFloat(selectedLoan.totalAmount || 0).toLocaleString()}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 3 }}>
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="agreement-upload-file"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="agreement-upload-file">
              <Button variant="outlined" component="span" fullWidth disabled={uploading}>
                {selectedFile ? selectedFile.name : 'Choose File'}
              </Button>
            </label>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Accepted formats: PDF, JPG, PNG (Max 10MB)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Agreement</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>Loan ID:</strong> #{selectedLoan.id}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Borrower:</strong> {selectedLoan.borrower?.fullName || 'N/A'}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Missing signature on page 2, Document is not clear, etc."
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRejectSubmit}
            variant="contained"
            color="error"
            disabled={!rejectReason.trim()}
          >
            Reject Agreement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanAgreementManagement;
