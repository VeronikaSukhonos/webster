import { useEffect, useState } from 'react';
import { Dialog } from 'react-aria-components/Dialog';
import {
  Modal as RACModal,
  type ModalOverlayProps as RACModalProps,
} from 'react-aria-components/Modal';

import { selectUi, setModal } from '@store/uiSlice';

import {
  CreateProjectForm,
  CreateTemplateForm,
  DeletionForm,
  ExportProjectForm,
  ProjectSettingsForm,
  TemplateSettingsForm,
} from '@components/Forms';
import { AvatarForm } from '@components/users/AvatarForm';

import { useAppDispatch, useAppSelector } from '@hooks/utilHooks';

import './Modal.css';

export interface ModalProps extends Omit<RACModalProps, 'isOpen' | 'children' | 'style'> {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
  children?: React.ReactNode;
  isCloseDisabled?: boolean;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export const Modal = ({
  isOpen,
  setIsOpen,
  title,
  children,
  isCloseDisabled,
  onClose,
  style,
  ...props
}: ModalProps) => {
  useEffect(() => {
    if (!isOpen && onClose) onClose();
  }, [isOpen]);

  return (
    <RACModal
      className="modal-container col all-center"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isDismissable={!isCloseDisabled}
      isKeyboardDismissDisabled={isCloseDisabled}
      {...props}
    >
      <Dialog className="modal-content col box pd-box scroll" aria-label={title} style={style}>
        {title && <h2 className="content-title t-art t-center">{title}</h2>}
        {children}
      </Dialog>
    </RACModal>
  );
};

interface ModalContent {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const ModalWrapper = () => {
  const dispatch = useAppDispatch();

  const modal = useAppSelector(selectUi.modal);
  const [isOpen, setIsOpen] = useState(false);
  const initialContent = { title: '', children: <></> };
  const [modalContent, setModalContent] = useState<ModalContent>(initialContent);
  const [onOpenChange, setOnOpenChange] = useState<(() => void) | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (modal) {
      if (modal.type === 'updateAvatar')
        setModalContent({
          title: 'Avatar',
          children: <AvatarForm setIsOpen={setIsOpen} />,
          style: { background: 'var(--opaque-container-color)', width: 'auto' },
        });
      else if (modal.type === 'createProject')
        setModalContent({
          title: 'New Project',
          children: (
            <CreateProjectForm
              template={modal.template}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              setIsOpen={setIsOpen}
              setOnOpenChange={setOnOpenChange}
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
              setIsOpen={setIsOpen}
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
              setIsOpen={setIsOpen}
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
              setIsOpen={setIsOpen}
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
              setIsOpen={setIsOpen}
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
              setIsOpen={setIsOpen}
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
              setIsOpen={setIsOpen}
            />
          ),
        });
      setIsOpen(true);
    }
  }, [modal]);

  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      {...modalContent}
      isCloseDisabled={isLoading}
      onClose={() => dispatch(setModal(null))}
      onOpenChange={(open) => {
        if (!open && onOpenChange) onOpenChange();
        setIsOpen(open);
      }}
    />
  );
};
