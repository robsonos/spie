export interface SelectChangeEventDetail<T> {
  value: T;
}

export interface SelectCustomEvent<T> extends CustomEvent {
  detail: SelectChangeEventDetail<T>;
  target: HTMLIonSelectElement;
}

export interface CheckboxChangeEventDetail<T> {
  value: T;
  checked: boolean;
}

export interface CheckboxCustomEvent<T> extends CustomEvent {
  detail: CheckboxChangeEventDetail<T>;
  target: HTMLIonCheckboxElement;
}

type RangeValue = number | { lower: number; upper: number };

export interface RangeChangeEventDetail {
  value: RangeValue;
}

export interface RangeCustomEvent extends CustomEvent {
  detail: RangeChangeEventDetail;
  target: HTMLIonRangeElement;
}

export interface InputChangeEventDetail {
  value?: string | undefined | null;
}
export interface IonInputCustomEvent extends CustomEvent {
  detail: InputChangeEventDetail;
  target: HTMLIonInputElement;
}
