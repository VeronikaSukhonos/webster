import { useEffect, useMemo, useRef, useState } from 'react';

import { MainButton } from '@components/MainButton';

import { ArrowIcon, EyeCloseIcon, EyeOpenIcon } from '@assets/index';

import { useClickOutside } from '@hooks/useClickOutside';

import type { FakeEvent } from '@mytypes/utilTypes';

import './InputFields.css';

interface LabelProps {
  label?: string;
  forInput?: string;
  required?: boolean;
}

const Label = ({ label, forInput, required = false }: LabelProps) => {
  if (!label) return;

  return forInput ? (
    <label className={'field-label' + (required ? ' required' : '')} htmlFor={forInput}>
      {label}
    </label>
  ) : (
    <span className={'field-label' + (required ? ' required' : '')}>{label}</span>
  );
};

interface BaseInputProps {
  name: string;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}

interface TextFieldProps extends BaseInputProps {
  value?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | FakeEvent) => void;
}

export interface TextFieldExtendedProps extends TextFieldProps {
  area?: boolean;
}

export const TextField = ({
  name,
  value,
  onChange,
  error,
  label,
  required = false,
  disabled = false,
  placeholder = '',
  autoComplete = 'off',
  id,
  area = false,
}: TextFieldExtendedProps) => {
  return (
    <div className="field">
      <Label label={label} forInput={id ?? name} required={required} />
      <div className={'field-container' + (area ? ' area' : '')}>
        {area ? (
          <textarea
            id={id ?? name}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={autoComplete}
          ></textarea>
        ) : (
          <input
            type="text"
            id={id ?? name}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        )}
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
};

interface PasswordFieldProps extends TextFieldProps {
  autoComplete?: 'current-password' | 'new-password' | 'off';
}

export const PasswordField = ({
  name,
  value = '',
  onChange,
  error,
  label,
  required = false,
  disabled = false,
  placeholder = '',
  autoComplete = 'off',
  id,
}: PasswordFieldProps) => {
  const [pwOpen, setPwOpen] = useState(false);

  return (
    <div className="field">
      <Label label={label} forInput={id ?? name} required={required} />
      <div className="field-container">
        <input
          type={pwOpen ? 'text' : 'password'}
          id={id ?? name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button className="icon-button" type="button">
          {pwOpen ? (
            <EyeOpenIcon onClick={() => setPwOpen(false)} />
          ) : (
            <EyeCloseIcon className="not-active" onClick={() => setPwOpen(true)} />
          )}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
};
