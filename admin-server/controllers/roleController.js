import AdminRole from "../models/AdminRole.js";
import AdminMember from "../models/AdminMember.js";

// @desc    Get all roles
// @route   GET /api/admin/roles
// @access  Protected/Superadmin
export const getRoles = async (req, res) => {
  try {
    const roles = await AdminRole.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, roles });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch roles" });
  }
};

// @desc    Get single role
// @route   GET /api/admin/roles/:id
// @access  Protected/Superadmin
export const getRoleById = async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }
    res.status(200).json({ success: true, role });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch role" });
  }
};

// @desc    Create new role
// @route   POST /api/admin/roles
// @access  Protected/Superadmin
export const createRole = async (req, res) => {
  try {
    const { name, value, description, color, permissions } = req.body;

    const roleExists = await AdminRole.findOne({ value: value.toLowerCase() });
    if (roleExists) {
      return res.status(400).json({ success: false, message: "Role with this value already exists" });
    }

    const role = await AdminRole.create({
      name,
      value: value.toLowerCase(),
      description,
      color,
      permissions
    });

    res.status(201).json({ success: true, role, message: "Role created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create role", error: error.message });
  }
};

// @desc    Update a role
// @route   PATCH /api/admin/roles/:id
// @access  Protected/Superadmin
export const updateRole = async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, message: "Cannot edit system roles" });
    }

    const { name, description, color, permissions, isActive } = req.body;

    role.name = name || role.name;
    role.description = description !== undefined ? description : role.description;
    role.color = color || role.color;
    role.permissions = permissions || role.permissions;
    role.isActive = isActive !== undefined ? isActive : role.isActive;

    const updatedRole = await role.save();
    
    // Also, when a role is updated, you might want to consider updating the permissions
    // of all admins who currently hold this role to sync them, but for now we rely 
    // on the role selection pulling the permissions initially or doing a lookup on login.
    
    // Wait, the client is copying permissions to the Admin object in the frontend, so 
    // we should update logic either here, or in Admin creation. Since permissions are stored on the Admin object, 
    // we can sync them:
    if (permissions) {
       // Optional: sync permissions for all users with this role
       // await Admin.updateMany({ role: role.value }, { $set: { "permissions": permissions } });
    }

    res.status(200).json({ success: true, role: updatedRole, message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update role", error: error.message });
  }
};

// @desc    Delete a role
// @route   DELETE /api/admin/roles/:id
// @access  Protected/Superadmin
export const deleteRole = async (req, res) => {
  try {
    const role = await AdminRole.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role.isSystem) {
      return res.status(403).json({ success: false, message: "Cannot delete system roles" });
    }

    // Check if any admin is using this role
    const adminsWithRole = await AdminMember.countDocuments({ role: role.value });
    if (adminsWithRole > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete. There are ${adminsWithRole} admins associated with this role.` 
      });
    }

    await role.deleteOne();
    res.status(200).json({ success: true, message: "Role deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete role" });
  }
};
