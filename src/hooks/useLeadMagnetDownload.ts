import { useState } from 'react';
import { LeadMagnet } from '@/components/marketing/LeadMagnetCard';

export function useLeadMagnetDownload() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadMagnet, setSelectedLeadMagnet] = useState<LeadMagnet | null>(null);

  const openDownloadModal = (leadMagnet: LeadMagnet) => {
    setSelectedLeadMagnet(leadMagnet);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeadMagnet(null);
  };

  return {
    isModalOpen,
    selectedLeadMagnet,
    openDownloadModal,
    closeModal,
  };
}
