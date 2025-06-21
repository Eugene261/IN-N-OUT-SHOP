import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Users, 
  MoreVertical, 
  Eye, 
  UserCheck, 
  UserX, 
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

function AdminUserManagement() {
  const { user } = useSelector((state) => state.auth);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    page: 1,
    limit: 10
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role })
      });

      const response = await fetch(`${API_BASE_URL}/api/users/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  };

  const handleRoleFilter = (value) => {
    setFilters(prev => ({ ...prev, role: value === 'all' ? '' : value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleRoleChange = async (userId, newRole) => {
    if (user.role !== 'superAdmin') {
      toast({
        title: 'Error',
        description: 'Only SuperAdmins can change user roles',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'User role updated successfully',
          variant: 'default'
        });
        fetchUsers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
          variant: 'default'
        });
        fetchUsers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user status',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (user.role !== 'superAdmin') {
      toast({
        title: 'Error',
        description: 'Only SuperAdmins can delete users',
        variant: 'destructive'
      });
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
          variant: 'default'
        });
        fetchUsers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superAdmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getInitials = (firstName, lastName, userName) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return userName ? userName.slice(0, 2).toUpperCase() : 'U';
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'Not set';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or username..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label>Filter by Role</Label>
              <Select value={filters.role || 'all'} onValueChange={handleRoleFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superAdmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((userItem) => (
                    <TableRow key={userItem._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={userItem.avatar} alt="Avatar" />
                            <AvatarFallback>
                              {getInitials(userItem.firstName, userItem.lastName, userItem.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {userItem.firstName || userItem.lastName
                                ? `${userItem.firstName} ${userItem.lastName}`.trim()
                                : userItem.userName
                              }
                            </p>
                            <p className="text-sm text-gray-500">{userItem.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(userItem.role)}>
                          {userItem.role === 'superAdmin' ? 'Super Admin' : 
                           userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(userItem.isActive)}>
                          {userItem.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(userItem.lastLogin)}
                      </TableCell>
                      <TableCell>
                        {formatDate(userItem.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View User Details */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(userItem)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>User Details</DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16">
                                      <AvatarImage src={selectedUser.avatar} alt="Avatar" />
                                      <AvatarFallback className="text-lg">
                                        {getInitials(selectedUser.firstName, selectedUser.lastName, selectedUser.userName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-lg font-semibold">
                                        {selectedUser.firstName || selectedUser.lastName
                                          ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim()
                                          : selectedUser.userName
                                        }
                                      </h3>
                                      <Badge className={getRoleColor(selectedUser.role)}>
                                        {selectedUser.role === 'superAdmin' ? 'Super Admin' : 
                                         selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                                      </Badge>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm">{selectedUser.email}</span>
                                      </div>
                                      {selectedUser.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{selectedUser.phone}</span>
                                        </div>
                                      )}
                                      {selectedUser.dateOfBirth && (
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{formatDate(selectedUser.dateOfBirth)}</span>
                                        </div>
                                      )}
                                      {selectedUser.shopName && (
                                        <div className="flex items-center gap-2">
                                          <Building className="w-4 h-4 text-gray-500" />
                                          <span className="text-sm">{selectedUser.shopName}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div>
                                        <span className="text-sm font-medium">Status: </span>
                                        <Badge className={getStatusColor(selectedUser.isActive)}>
                                          {selectedUser.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium">Joined: </span>
                                        <span className="text-sm">{formatDate(selectedUser.createdAt)}</span>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium">Last Login: </span>
                                        <span className="text-sm">{formatDate(selectedUser.lastLogin)}</span>
                                      </div>
                                      <div>
                                        <span className="text-sm font-medium">Balance: </span>
                                        <span className="text-sm">GH₵ {selectedUser.balance || 0}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Change Role (SuperAdmin only) */}
                          {user.role === 'superAdmin' && userItem._id !== user.id && (
                            <Select
                              value={userItem.role}
                              onValueChange={(newRole) => handleRoleChange(userItem._id, newRole)}
                              disabled={actionLoading}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superAdmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {/* Toggle Status */}
                          {userItem._id !== user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(userItem._id, userItem.isActive)}
                              disabled={actionLoading}
                            >
                              {userItem.isActive ? (
                                <UserX className="w-4 h-4 text-red-500" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                          )}

                          {/* Delete User (SuperAdmin only) */}
                          {user.role === 'superAdmin' && userItem._id !== user.id && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(userItem._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {users.length} of {pagination.totalUsers} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUserManagement; 