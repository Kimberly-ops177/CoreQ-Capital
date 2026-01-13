import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AppBar,
  Toolbar,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Download,
  CheckCircle,
  Cancel,
  PendingActions,
  Refresh,
  Print,
  Edit,
  Delete
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoanAgreements = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [agreements, setAgreements] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchAgreements();
    if (user?.role === 'admin') {
      fetchPendingApprovals();
    }
  }, [user]);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/loan-applications/agreements');
      setAgreements(res.data);
    } catch (err) {
      console.error('Error fetching agreements:', err);
      setError(err.response?.data?.error || 'Failed to fetch agreements');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await axios.get('/api/loan-applications/pending-approvals');
      setPendingApprovals(res.data);
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    }
  };

  const handleDownloadAgreement = async (loanId) => {
    try {
      const response = await axios.get(`/api/loan-applications/${loanId}/download-agreement`, {
        responseType: 'blob'
      });

      // Create blob with correct DOCX MIME type
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Loan_Agreement_${loanId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Agreement downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error downloading agreement:', err);
      setError(err.response?.data?.error || 'Failed to download agreement');
    }
  };

  const handlePrintAgreement = async (loanId) => {
    try {
      const response = await axios.get(`/api/loan-applications/${loanId}/download-agreement`, {
        responseType: 'blob'
      });

      // Create blob with correct DOCX MIME type
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      const url = window.URL.createObjectURL(blob);

      // Download the DOCX file so user can open in Word and print
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Loan_Agreement_${loanId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('Agreement downloaded! Open in Microsoft Word to print.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error downloading agreement:', err);
      setError(err.response?.data?.error || 'Failed to download agreement');
    }
  };


  const handleApprovalClick = (loan) => {
    setSelectedLoan(loan);
    setNotes('');
    setApprovalDialog(true);
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/loan-applications/${selectedLoan.id}/approve`, {
        notes: notes || null
      });

      setSuccess(`Loan agreement #${selectedLoan.id} approved successfully!`);
      setApprovalDialog(false);
      fetchAgreements();
      fetchPendingApprovals();
    } catch (err) {
      console.error('Error approving agreement:', err);
      setError(err.response?.data?.error || 'Failed to approve agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      await axios.post(`/api/loan-applications/${selectedLoan.id}/reject`, {
        notes: notes || 'Agreement rejected'
      });

      setSuccess(`Loan agreement #${selectedLoan.id} rejected.`);
      setApprovalDialog(false);
      fetchAgreements();
      fetchPendingApprovals();
    } catch (err) {
      console.error('Error rejecting agreement:', err);
      setError(err.response?.data?.error || 'Failed to reject agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (loan) => {
    setSelectedLoan(loan);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/loan-applications/${selectedLoan.id}`);

      setSuccess(`Loan #${selectedLoan.id} deleted successfully!`);
      setDeleteDialog(false);
      fetchAgreements();
    } catch (err) {
      console.error('Error deleting loan:', err);
      setError(err.response?.data?.error || 'Failed to delete loan');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (loan) => {
    // Navigate to new loan page with loan ID for editing
    navigate(`/new-loan?edit=${loan.id}`);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending_approval: { label: 'Pending Approval', color: 'info', icon: <PendingActions /> },
      approved: { label: 'Approved', color: 'success', icon: <CheckCircle /> },
      rejected: { label: 'Rejected', color: 'error', icon: <Cancel /> }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
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
            Core Q Capital - Loan Agreements
          </Typography>
          <Button color="inherit" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/employee')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000000' }}>
            Loan Agreements
          </Typography>
          <IconButton onClick={fetchAgreements} color="primary">
            <Refresh />
          </IconButton>
        </Box>

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

        {/* All Agreements Table */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            All Loan Agreements
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Loan ID</strong></TableCell>
                    <TableCell><strong>Borrower</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Date Issued</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="center"><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agreements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="textSecondary">
                          No loan agreements found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    agreements.map((loan) => (
                      <TableRow key={loan.id} hover>
                        <TableCell>#{loan.id}</TableCell>
                        <TableCell>{loan.borrower?.fullName}</TableCell>
                        <TableCell>KSH {parseFloat(loan.amountIssued).toLocaleString()}</TableCell>
                        <TableCell>{new Date(loan.dateIssued).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusChip(loan.agreementStatus)}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="Download Unsigned Agreement">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleDownloadAgreement(loan.id)}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Print Agreement">
                            <IconButton
                              size="small"
                              color="secondary"
                              onClick={() => handlePrintAgreement(loan.id)}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>

                          {(loan.agreementStatus === 'pending_approval' || loan.agreementStatus === 'pending_upload') && (
                            <>
                              <Tooltip title="Edit Loan">
                                <IconButton
                                  size="small"
                                  color="info"
                                  onClick={() => handleEditClick(loan)}
                                  sx={{ ml: 1 }}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete Loan">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteClick(loan)}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>

                              {user.role === 'admin' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    onClick={async () => {
                                      if (window.confirm(`Approve loan agreement #${loan.id}?`)) {
                                        try {
                                          await axios.post(`/api/loan-applications/${loan.id}/approve`, { notes: null });
                                          setSuccess(`Loan agreement #${loan.id} approved!`);
                                          fetchAgreements();
                                          fetchPendingApprovals();
                                        } catch (err) {
                                          setError(err.response?.data?.error || 'Failed to approve');
                                        }
                                      }
                                    }}
                                    startIcon={<CheckCircle />}
                                    sx={{ ml: 1 }}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => handleApprovalClick(loan)}
                                    startIcon={<Cancel />}
                                    sx={{ ml: 1 }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </>
                          )}

                          {loan.agreementStatus === 'approved' && (
                            <Chip label="Approved" color="success" size="small" sx={{ ml: 1 }} />
                          )}

                          {loan.agreementStatus === 'rejected' && (
                            <Tooltip title={loan.agreementNotes || 'Rejected'}>
                              <Chip label="Rejected" color="error" size="small" sx={{ ml: 1 }} />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Loan Agreement</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Loan ID: #{selectedLoan?.id} - {selectedLoan?.borrower?.fullName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Amount: KSH {parseFloat(selectedLoan?.amountIssued || 0).toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Uploaded: {selectedLoan?.signedAgreementUploadedAt && new Date(selectedLoan.signedAgreementUploadedAt).toLocaleString()}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="outlined"
            color="error"
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Loan Application</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this loan application?
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Loan ID: #{selectedLoan?.id} - {selectedLoan?.borrower?.fullName}
          </Typography>
          <Typography variant="body2" gutterBottom>
            Amount: KSH {parseFloat(selectedLoan?.amountIssued || 0).toLocaleString()}
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action will permanently delete the loan, borrower, and collateral records. This cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoanAgreements;
