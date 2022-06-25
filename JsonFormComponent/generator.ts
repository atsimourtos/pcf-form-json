import { convertToJson, isValidHttpUrl } from './common';
import { generateBoolean } from './controls/boolean';
import { generateDate, getDateValue } from './controls/date';
import { generateDefault } from './controls/default';
import { generateLookup } from './controls/lookup';
import { generateCheckbox, setCheckBoxValue } from './controls/checkbox';
import { generateNumber } from './controls/number';
import { generateOptionSet } from './controls/optionset';
import { IInputs } from './generated/ManifestTypes';
import { UiDefinition, FormValue } from './types';
import { generateDateTime, setDateTimeValue } from './controls/datetime';

export class Generator {

  private initialFormValue: FormValue;
  private metaDataSchema: UiDefinition;
  private loadedSchemaUri: string;
  private jsonSchema: string;

  constructor(
    private container: HTMLDivElement,
    context: ComponentFramework.Context<IInputs>,
    private onChange: (result: string) => void
  ) {
    this.initialFormValue = convertToJson<FormValue>(
      context.parameters.StringProperty.raw
    );
  }

  async generate(context: ComponentFramework.Context<IInputs>) {

    if (!context.parameters.ControlFormJson.raw || 
      context.parameters.ControlFormJson.raw === 'val') return;

    var jsonSchemaSource = context.parameters.ControlFormJson.raw;

    if(isValidHttpUrl(jsonSchemaSource)) {
      if (this.loadedSchemaUri !== jsonSchemaSource) {
        this.jsonSchema = await (await fetch(jsonSchemaSource)).text();
        this.loadedSchemaUri = jsonSchemaSource;
      }
    }
    else {
      this.loadedSchemaUri = '';
      this.jsonSchema = jsonSchemaSource;
    }

    this.metaDataSchema = convertToJson<UiDefinition>(
      this.jsonSchema
    );

    document.getElementById('insurgo-custom-form')?.remove();

    const mainDiv = document.createElement('div');
    mainDiv.setAttribute('id', 'insurgo-custom-form');

    for (const control of this.metaDataSchema.controls) {

      const typeName = control.typeName ?? control.name;
      const value = this.initialFormValue[control.name];

      const div = this.generateFormControlDiv();
      const label = this.generateLabel(control.label);
      div.appendChild(label);

      let shouldSaveFormOnChange = true;
      let controlElement: HTMLElement;
      switch (control.type) {
        case 'boolean':
          controlElement = generateBoolean(control, value as boolean);
          break;
        case 'lookup':
          const currentDefinition = this.metaDataSchema.lookupMetadata[typeName];
          controlElement = generateLookup(
            context.utils,
            control,
            currentDefinition,
            value as ComponentFramework.EntityReference[]
          );
          break;
        case 'number':
          controlElement = generateNumber(control, value as number);
          break;
        case 'optionset':
          const optionSets = this.metaDataSchema.optionSetMetadata[typeName];
          controlElement = generateOptionSet(control, value as number, optionSets);
          break;
        case 'checkbox':
          const metadata = this.metaDataSchema.optionSetMetadata[typeName];
          controlElement = generateCheckbox(control, metadata, value as number[] | string[] | null);
          break;
        case 'date':
          controlElement = generateDate(control, value as string);
          break;
        case 'datetime':
          controlElement = generateDateTime(control, value as string);
          break;
        default:
          controlElement = generateDefault(control, value as string);
          break;
      }

      controlElement.onchange = () => this.saveForm();

      div.appendChild(controlElement);

      mainDiv.appendChild(div);
    }

    this.container.appendChild(mainDiv);
  }

  private saveForm() {

    for (const control of this.metaDataSchema.controls) {
      if (control.type == 'checkbox') {
        setCheckBoxValue(control);
      } else if (control.type == 'datetime') {
        setDateTimeValue(control);
      }

      const element = document.getElementById(
        'insurgo-' + control.name.toLowerCase()
      ) as HTMLInputElement;
      if (!element) continue;

      this.initialFormValue[control.name] =
        control.type == 'boolean'
          ? element.checked
          : control.type == 'number'
            ? element.valueAsNumber
            : control.type == 'lookup'
              ? (element.value ? JSON.parse(element.value) : null)
              : control.type == 'optionset'
                ? (element.value != 'Choose..' ? parseInt(element.value) : null)
                : control.type == 'date'
                  ? getDateValue(element.valueAsDate)
                  : control.type == 'datetime'
                    ? element.value
                    : control.type == 'checkbox'
                      ? JSON.parse(element.value)
                      : element.value;
    }

    this.onChange(JSON.stringify(this.initialFormValue));
  }

  private generateLabel(labelName: string): HTMLLabelElement {
    const label = document.createElement('label');
    label.innerText = labelName;
    label.textContent = labelName;
    return label;
  }

  private generateFormControlDiv(): HTMLDivElement {
    const div = document.createElement('div');
    div.setAttribute('class', 'form-group');

    return div;
  }

  public getData(): string{
    return JSON.stringify(this.initialFormValue);
  }
}
