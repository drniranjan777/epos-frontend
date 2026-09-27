import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { QuantityInput } from './QuantityInput';

function Harness(props) {
  const [value, setValue] = useState(props.initial ?? '1');
  return <QuantityInput value={value} onChange={setValue} unit="PCS" {...props} />;
}

describe('QuantityInput', () => {
  it('steps up and down but never below zero', () => {
    render(<Harness initial="1" />);
    const input = screen.getByLabelText('Quantity');
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(input).toHaveValue('2');
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(input).toHaveValue('0');
  });

  it('does not step above the maximum', () => {
    render(<Harness initial="4" max={5} />);
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(screen.getByLabelText('Quantity')).toHaveValue('5');
  });

  it('strips decimals for whole-number units and keeps them otherwise', () => {
    const { unmount } = render(<Harness initial="" />);
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2.5' } });
    expect(screen.getByLabelText('Quantity')).toHaveValue('25');
    unmount();

    render(<Harness initial="" allowDecimal />);
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2.5' } });
    expect(screen.getByLabelText('Quantity')).toHaveValue('2.5');
  });

  it('shows validation errors', () => {
    render(<Harness error="Only 42 available" />);
    expect(screen.getByText('Only 42 available')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toHaveAttribute('aria-invalid', 'true');
  });
});
