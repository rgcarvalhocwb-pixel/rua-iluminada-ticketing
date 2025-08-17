import TicketValidator from '@/components/mobile/TicketValidator';
import OfflineTicketValidator from '@/components/mobile/OfflineTicketValidator';

const TicketValidation = () => {
  return (
    <div className="min-h-screen bg-background">
      <OfflineTicketValidator />
    </div>
  );
};

export default TicketValidation;