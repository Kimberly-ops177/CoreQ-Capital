const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Admins have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has the specific permission
    const permissions = req.user.permissions || {};

    if (!permissions[permission]) {
      return res.status(403).send({
        error: 'Access denied',
        message: `You do not have permission to ${permission.replace('can', '').replace(/([A-Z])/g, ' $1').toLowerCase()}`
      });
    }

    next();
  };
};

// Check multiple permissions (user must have at least one)
const checkAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Admins have all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.user.permissions || {};
    const hasPermission = permissions.some(perm => userPermissions[perm]);

    if (!hasPermission) {
      return res.status(403).send({
        error: 'Access denied',
        message: 'You do not have sufficient permissions for this action'
      });
    }

    next();
  };
};

// Check branch access
const checkBranchAccess = (getBranchFromRequest) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Admins and users with canAccessAllBranches can access any branch
    if (req.user.role === 'admin' || req.user.canAccessAllBranches) {
      return next();
    }

    const requestedBranch = await getBranchFromRequest(req);

    if (requestedBranch && req.user.branch && requestedBranch !== req.user.branch) {
      return res.status(403).send({
        error: 'Access denied',
        message: `You can only access data from ${req.user.branch} branch`
      });
    }

    next();
  };
};

module.exports = { checkPermission, checkAnyPermission, checkBranchAccess };
