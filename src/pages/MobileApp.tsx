import { Routes, Route, Navigate } from 'react-router-dom';
import MobileManager from './MobileManager';
import TicketValidation from './TicketValidation';

const MobileApp = () => {
  return (
    <div className="mobile-app">
      <Routes>
        <Route path="/mobile" element={<MobileManager />} />
        <Route path="/mobile/validator" element={<TicketValidation />} />
        <Route path="/mobile/*" element={<Navigate to="/mobile" replace />} />
      </Routes>
    </div>
  );
};

export default MobileApp;