import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const getNavItems = () => {
    const baseItems = [
      { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    ];
    
    if (currentUser?.role === 'nurse' || currentUser?.role === 'doctor') {
      baseItems.push(
        { path: '/patients', label: 'Patients', icon: '👥' },
        { path: '/medical-records', label: 'Records', icon: '📋' }
      );
    }
    
    if (currentUser?.role === 'doctor') {
      baseItems.push(
        { path: '/prescriptions', label: 'Prescriptions', icon: '💊' },
        { path: '/appointments', label: 'Appointments', icon: '📅' }
      );
    }
    
    if (currentUser?.role === 'nurse') {
      baseItems.push(
        { path: '/vitals', label: 'Vital Signs', icon: '❤️' },
        { path: '/appointments', label: 'Appointments', icon: '📅' }
      );
    }
    
    if (currentUser?.role === 'lab') {
      baseItems.push(
        { path: '/lab-results', label: 'Lab Tests', icon: '🧪' },
        { path: '/lab-results', label: 'Results', icon: '🔬' }
      );
    }
    
    if (currentUser?.role === 'pharmacist') {
      baseItems.push(
        { path: '/prescriptions', label: 'Prescriptions', icon: '💊' },
        { path: '/inventory', label: 'Inventory', icon: '📦' }
      );
    }
    
    if (currentUser?.role === 'admin') {
      baseItems.push(
        { path: '/users', label: 'Users', icon: '👥' },
        { path: '/reports', label: 'Reports', icon: '📈' },
        { path: '/settings', label: 'Settings', icon: '⚙️' }
      );
    }
    
    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}>
        {!isMobile && (
          <button className="sidebar-toggle" onClick={toggleSidebar} />
        )}
        
        <div className="sidebar-header">
          <h2>MediCare System</h2>
          <p>{currentUser?.name || currentUser?.role}</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={location.pathname === item.path ? 'active' : ''}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {!isMobile && (
        <div style={{ marginLeft: collapsed ? '80px' : '280px', transition: 'margin-left 0.3s ease' }} />
      )}
    </>
  );
};

export default Sidebar;