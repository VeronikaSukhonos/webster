import { useEffect, useMemo, useState } from 'react';
import { DropZone as RACDropZone } from 'react-aria-components/DropZone';
import { FileTrigger as RACFileTrigger } from 'react-aria-components/FileTrigger';
import {
  Input as RACInput,
  NumberField as RACNumberField,
} from 'react-aria-components/NumberField';
import { useResizeDetector } from 'react-resize-detector';
import { toast } from 'react-toastify';

import clsx from 'clsx';

import { MainButton } from '@components/MainButton';
import { DropdownMenu, MenuItem } from '@components/Menu';

import {
  ChevronIcon,
  EyeCloseIcon,
  EyeOpenIcon,
  LockIcon,
  PlusIcon,
  UnlockIcon,
  UploadIcon,
} from '@assets/index';

import { MAX_FILE_SIZE, SUPPORTED_UPLOADS } from '@utils/constants';

import type { ImageItem, Size } from '@mytypes/editorTypes';
import type { FakeEvent } from '@mytypes/utilTypes';

import './InputFields.css';

export interface FieldWrapperProps {
  children: React.ReactNode;
  className?: string;
  noBackground?: boolean;
  multipleInputs?: boolean;
  label?: string;
  labelFor?: string;
  required?: boolean;
  error?: string;
}

export const FieldWrapper = ({
  children,
  className,
  noBackground = false,
  multipleInputs = false,
  label,
  labelFor,
  required = false,
  error,
}: FieldWrapperProps) => {
  const labelClassName = { className: clsx('field-label', required && 'required') };

  return (
    <div className="field">
      {label &&
        (labelFor ? (
          <label {...labelClassName} htmlFor={labelFor}>
            {label}
          </label>
        ) : (
          <span {...labelClassName}>{label}</span>
        ))}

      <div
        className={clsx(
          noBackground || multipleInputs ? 'row no-wide' : 'field-container',
          className,
        )}
      >
        {children}
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
};

interface BaseInputProps extends Pick<FieldWrapperProps, 'label' | 'required' | 'error'> {
  name: string;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
}

interface TextFieldProps extends BaseInputProps {
  value?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | FakeEvent) => void;
}

interface TextFieldExtendedProps extends TextFieldProps {
  area?: boolean;
}

export const TextField = ({
  name,
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '',
  autoComplete = 'off',
  area = false,
  ...wrapperProps
}: TextFieldExtendedProps) => {
  const props = {
    id: id ?? name,
    name,
    value: value ?? '',
    onChange,
    disabled,
    placeholder,
    autoComplete,
  };

  return (
    <FieldWrapper className={clsx(area && 'area')} labelFor={id ?? name} {...wrapperProps}>
      {area ? <textarea {...props}></textarea> : <input type="text" {...props} />}
    </FieldWrapper>
  );
};

interface PasswordFieldProps extends TextFieldProps {
  autoComplete?: 'current-password' | 'new-password' | 'off';
}

export const PasswordField = ({
  name,
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '',
  autoComplete = 'off',
  ...wrapperProps
}: PasswordFieldProps) => {
  const [isPwOpen, setIsPwOpen] = useState(false);

  return (
    <FieldWrapper labelFor={id ?? name} {...wrapperProps}>
      <input
        type={isPwOpen ? 'text' : 'password'}
        id={id ?? name}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <MainButton
        onClick={() => setIsPwOpen((open) => !open)}
        noStyle
        className="icon-button"
        aria-label="Password Display"
      >
        {isPwOpen ? (
          <EyeOpenIcon className="own-color" />
        ) : (
          <EyeCloseIcon className="own-color not-active" />
        )}
      </MainButton>
    </FieldWrapper>
  );
};

interface NumberFieldProps extends Omit<BaseInputProps, 'autoComplete'> {
  value?: number | null;
  onChange: (e: FakeEvent) => void;
  min?: number;
  max?: number;
  step?: number;
  buttons?: boolean;
}

export const NumberField = ({
  name,
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '',
  min,
  max,
  step,
  buttons = false,
  ...wrapperProps
}: NumberFieldProps) => {
  const props = {
    name,
    id: id ?? name,
    onChange: (val: number | undefined) => onChange({ target: { name, value: val || null } }),
    isDisabled: disabled,
    placeholder,
    minValue: min,
    maxValue: max,
    step,
  };

  return (
    <FieldWrapper labelFor={id ?? name} {...wrapperProps}>
      <RACNumberField value={value || NaN} {...props} aria-label={props.id}>
        {buttons && <MainButton slot="decrement">-</MainButton>}
        <RACInput />
        {buttons && <MainButton slot="increment">+</MainButton>}
      </RACNumberField>
    </FieldWrapper>
  );
};

interface SizeFieldProps extends Omit<
  NumberFieldProps,
  'id' | 'value' | 'placeholder' | 'buttons'
> {
  value: Size;
  innerLabels?: boolean;
  innerPlaceholders?: boolean;
  forceProportion?: number;
}

export const SizeField = ({
  name,
  value,
  innerLabels = false,
  innerPlaceholders = false,
  forceProportion,
  onChange,
  disabled = false,
  min,
  max,
  step = 1,
  ...wrapperProps
}: SizeFieldProps) => {
  const [isLocked, setIsLocked] = useState(false);
  const [widthToHeight, setWidthToHeight] = useState(1); // 1:1

  const props = {
    onChange: (val: FakeEvent) => {
      const v = {
        width: val.target.name === 'width' ? val.target.value : value.width,
        height: val.target.name === 'height' ? val.target.value : value.height,
      };

      if (!isLocked) setWidthToHeight(v.height && v.width ? v.height / v.width : 1);
      return onChange({ target: { name, value: v } });
    },
    disabled,
    min,
    max,
    step,
    required: wrapperProps.required,
  };

  useEffect(() => {
    if (forceProportion) {
      setIsLocked(false);
      setWidthToHeight(forceProportion);
    }
  }, [forceProportion]);

  useEffect(() => {
    if (isLocked)
      onChange({
        target: { name, value: { width: value.width, height: value.width * widthToHeight } },
      });
  }, [value.width]);

  useEffect(() => {
    if (isLocked)
      onChange({
        target: {
          name,
          value: { width: Math.floor(value.height / widthToHeight), height: value.height },
        },
      });
  }, [value.height]);

  return (
    <FieldWrapper {...wrapperProps} noBackground multipleInputs>
      <NumberField
        name="width"
        value={value.width}
        {...props}
        {...(innerLabels && { label: 'Width' })}
        {...(innerPlaceholders && { placeholder: 'width' })}
      />
      <NumberField
        name="height"
        value={value.height}
        {...props}
        {...(innerLabels && { label: 'Height' })}
        {...(innerPlaceholders && { placeholder: 'height' })}
      />
      <div className="size-field-lock">
        <div className="no-wrap" style={{ fontWeight: 'bold' }}>
          px
        </div>
        <MainButton
          onClick={() => setIsLocked((locked) => !locked)}
          noStyle
          className="icon-button"
          aria-label="Password Display"
        >
          {isLocked ? (
            <LockIcon className="own-color" />
          ) : (
            <UnlockIcon className="own-color not-active" />
          )}
        </MainButton>
      </div>
    </FieldWrapper>
  );
};

interface SelectLabelProps {
  label: React.ReactNode;
  more?: React.ReactNode;
}

export const SelectLabel = ({ label, more }: SelectLabelProps) => {
  return (
    <div className="select-label">
      <div>{label}</div>
      {more && <div className="select-label-more">{more}</div>}
    </div>
  );
};

type SelectOptionValue = any;

interface SelectOption {
  value: SelectOptionValue;
  label: React.ReactElement<typeof SelectLabel>;
  disabled?: boolean;
}

export interface SelectProps extends Omit<BaseInputProps, 'id' | 'placeholder' | 'autoComplete'> {
  value?: SelectOptionValue;
  onChange: (value: FakeEvent) => void;
  options: SelectOption[];
}

export const SelectField = ({
  name,
  value,
  onChange,
  disabled = false,
  options = [],
  ...wrapperProps
}: SelectProps) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { width, ref } = useResizeDetector<HTMLButtonElement>({ handleHeight: false });

  const v = JSON.stringify(value);
  const s = useMemo(
    () => options.find((opt) => JSON.stringify(opt.value) === v) || options[0],
    [options, value],
  );

  return (
    <FieldWrapper {...wrapperProps} noBackground>
      <DropdownMenu
        button={
          <MainButton
            disabled={disabled}
            color="white"
            wide
            style={{ paddingTop: '3px', color: 'var(--dark-blue)' }}
            ref={ref}
          >
            {s.label}
            <ChevronIcon className={clsx('select-icon', isSelectOpen && 'open')} />
          </MainButton>
        }
        onOpenChange={(open) => setIsSelectOpen(open)}
        style={{ maxHeight: '140px', overflow: 'auto' }}
      >
        {options.map((opt) => {
          const optV = JSON.stringify(opt.value);

          return (
            <MenuItem
              className={clsx('select-option', optV === v && 'selected')}
              key={optV}
              isDisabled={opt.disabled}
              onAction={() => onChange({ target: { name, value: opt.value } })}
              style={{ width }}
            >
              {opt.label}
            </MenuItem>
          );
        })}
      </DropdownMenu>
    </FieldWrapper>
  );
};

interface ImageFieldProps extends Omit<BaseInputProps, 'autoComplete'> {
  value: ImageItem[];
  onChange: (e: FakeEvent) => void;
  onDelete: (e: FakeEvent) => void;
  maxFiles?: number;
}

export const ImageField = ({
  value,
  onChange,
  onDelete,
  maxFiles = 10,
  name,
  id,
  disabled,
  placeholder,
  ...wrapperProps
}: ImageFieldProps) => {
  const validateFiles = (files: File[] | FileList) => {
    const tmp = [];
    let error = false;

    for (const file of files) {
      if (value.length + tmp.length < maxFiles) {
        if (file.size > MAX_FILE_SIZE) {
          error = true;
          continue;
        }
        tmp.push(file);
      }
    }
    if (error) toast('Too large image size - max 5MB');
    if (tmp.length) onChange({ target: { name, value: tmp } });
  };

  return (
    <FieldWrapper {...wrapperProps}>
      <RACFileTrigger
        acceptedFileTypes={SUPPORTED_UPLOADS}
        allowsMultiple={maxFiles > 1}
        onSelect={(files) => {
          if (files) validateFiles(files);
        }}
      >
        <RACDropZone
          className="col mini-gap drop-zone"
          getDropOperation={(types) =>
            SUPPORTED_UPLOADS.some((t) => types.has(t)) ? 'copy' : 'cancel'
          }
          onDrop={async (e) => {
            const files = await Promise.all(
              e.items.filter((i) => i.kind === 'file').map((i) => i.getFile()),
            );

            if (files) validateFiles(files);
          }}
          style={{ width: '100%', padding: '7px 3px' }}
        >
          {value.length > 0 && (
            <div
              className="images-container"
              style={maxFiles === 1 ? { gridTemplateColumns: '100%' } : {}}
            >
              {value.map((img) => (
                <div key={img.id} className="uploaded-image-container">
                  <img src={img.url} className="uploaded-image" />
                  <button
                    type="button"
                    className="uploaded-image-delete"
                    onClick={() => onDelete({ target: { name, value: img.id } })}
                  >
                    <PlusIcon style={{ transform: 'rotate(45deg)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {value.length < maxFiles && (
            <div className="col grow mini-gap all-center">
              <MainButton color="blue" mini>
                <UploadIcon />
                Upload
              </MainButton>
              <div className="t-center" style={{ color: 'var(--dark-blue)', fontWeight: '700' }}>
                or drag and grop image{maxFiles > 1 && 's'} here
              </div>
            </div>
          )}
        </RACDropZone>
      </RACFileTrigger>
    </FieldWrapper>
  );
};
