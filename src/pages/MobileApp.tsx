import { Routes, Route, Navigate } from 'react-router-dom';
import MobileManager from './MobileManager';
import TicketValidation from './TicketValidation';

const MobileApp = () => {
  return (
    <div className="mobile-app">
      <Routes>
        <Route path="/" element={<MobileManager />} />
        <Route path="/validator" element={<TicketValidation />} />
        <Route path="/*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default MobileApp;