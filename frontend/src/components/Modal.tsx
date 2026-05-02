import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { selectUi, setModal } from '@store/uiSlice';

import {
  CreateProjectForm,
  CreateTemplateForm,
  DeletionForm,
  ExportProjectForm,
  ProjectSettingsForm,
  TemplateSettingsForm,
} from '@components/Forms';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
  children?: React.ReactNode;
  isCloseDisabled?: boolean;
  onClose?: () => void;
}

export const Modal = ({
  isOpen,
  setIsOpen,
  title,
  children,
  isCloseDisabled,
  onClose,
}: ModalProps) => {
  return createPortal(
    <div
      className={'modal-container col all-center ' + (isOpen ? 'open' : 'close')}
      onClick={() => {
        if (!isCloseDisabled) {
          setIsOpen(false);
          if (onClose) onClose();
        }
      }}
    >
      <div
        className="modal-content col box pd-box scroll"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {title && <h2 className="content-title t-art t-center">{title}</h2>}
        {children}
      </div>
    </div>,
    document.getElementById('portal') as HTMLDivElement,
  );
};

export const ModalWrapper = () => {
  const dispatch = useAppDispatch();

  const modal = useAppSelector(selectUi.modal);
  const [isOpen, setIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; children: React.ReactNode }>({
    title: '',
    children: <></>,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (modal) {
      setIsOpen(true);
      if (modal.type === 'createProject')
        setModalContent({
          title: 'New Project',
          children: (
            <CreateProjectForm
              template={modal.template}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
      else if (modal.type === 'createTemplate')
        setModalContent({
          title: 'New Template',
          children: (
            <CreateTemplateForm
              project={modal.project}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
      else if (modal.type === 'projectSettings')
        setModalContent({
          title: 'Project Settings',
          children: (
            <ProjectSettingsForm
              project={modal.project}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
      else if (modal.type === 'templateSettings')
        setModalContent({
          title: 'Template Settings',
          children: (
            <TemplateSettingsForm
              template={modal.template}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
      else if (modal.type === 'deleteProject')
        setModalContent({
          title: 'Project Deletion',
          children: (
            <DeletionForm
              project={modal.project}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
      else if (modal.type === 'deleteTemplate')
        setModalContent({
          title: 'Template Deletion',
          children: (
            <DeletionForm
              template={modal.template}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
      else if (modal.type === 'exportProject')
        setModalContent({
          title: 'Project Export',
          children: (
            <ExportProjectForm
              project={modal.project}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          ),
        });
    }
  }, [modal]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      {...modalContent}
      isCloseDisabled={isLoading}
      onClose={() => dispatch(setModal(null))}
    />
  );
};
