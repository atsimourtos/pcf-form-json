import { ControlDefinition } from '../types';
import { generateDefault } from './default';

function onLookupSearch(
  utils: ComponentFramework.Utility,
  definition: ComponentFramework.UtilityApi.LookupOptions,
  successFn: (result: ComponentFramework.LookupValue[]) => void
) {
  utils
    .lookupObjects({
      allowMultiSelect: definition.allowMultiSelect,
      defaultEntityType: definition.defaultEntityType,
      defaultViewId: definition.defaultViewId,
      entityTypes: definition.entityTypes,
      viewIds: definition.viewIds,
    })
    .then(
      (value: ComponentFramework.LookupValue[]) => {
        successFn(value);
      },
      (error) => console.error(error)
    );
}
function createOptionForEntity(id: string, name: string | undefined, parentElement: HTMLElement){

  if(id.includes('{') || id.includes("}"))
    id = id.replace("{", "").replace("}", "");

  var optionElement = document.createElement("option");
  optionElement.setAttribute('id', id);
  optionElement.text = name ?? id;
  parentElement.appendChild(optionElement);
}

export function generateLookup(
  utils: ComponentFramework.Utility,
  control: ControlDefinition,
  definition: ComponentFramework.UtilityApi.LookupOptions,
  value: ComponentFramework.EntityReference[],
): HTMLElement {


  const div = document.getElementById('display-' + control.name) || document.createElement('div');
  div.setAttribute('class', 'input-group');

  const input = definition.allowMultiSelect ? document.createElement('select') : document.createElement('text');
  input.setAttribute('class', 'form-control');
  input.setAttribute('id', 'display-' + control.name);

  const divChild = document.createElement('div');

  if(definition.allowMultiSelect){

    // Create multiple select
    input.setAttribute('multiple', '');
    input.setAttribute('size', '10');
    input.onchange = (e) => {e.stopPropagation()};

    var options = value && value.length > 0 ? value : null;

    if(options && options.length > 0){
      for (var i = 0; i < options.length; i++) {
        createOptionForEntity(options[i].id.toString(), options[i].name, input);
      }
    }

    // Create remove button
    const buttonRemove = document.createElement('button');
    buttonRemove.setAttribute('class', 'btn btn-primary');
    buttonRemove.innerText = 'Remove';
    buttonRemove.onclick = () => {

        var select = input as HTMLSelectElement;
        var options = select.options;

        if(options && options.length > 0){

          for(var i = options.length - 1; i >= 0; i--){

              if(options[i].selected){
                var oldValue = hidden.getAttribute('value')?.toString() ?? '';

                if(oldValue && oldValue.length > 0){
                  var currrentRelatedEntities = JSON.parse(oldValue) as ComponentFramework.LookupValue[];

                  var idToExclude = "{"+options[i].id +"}";

                  var newRelatedEntities = currrentRelatedEntities.filter(a => a.id.toString() !== idToExclude);
                  hidden.setAttribute('value', JSON.stringify(newRelatedEntities));
                  div.dispatchEvent(new Event('change'));
                }

                select.remove(i);
              }
          }
        }
        

    };
    divChild.appendChild(buttonRemove);
  }
  else{
    input.textContent = value && value.length > 0 ? value[0].name ?? value[0].id : '';
    input.setAttribute("readonly", 'true');
  }

  div.appendChild(input);

  
  // divChild.setAttribute('class', 'input-group-prepend');
  const buttonAdd = document.createElement('button');
  buttonAdd.setAttribute('class', 'btn btn-primary');
  buttonAdd.innerText = 'Add';
  buttonAdd.onclick = () => {
    const successFn = (result: ComponentFramework.LookupValue[]): void => {
   
      if(result.length > 0){


        if(definition.allowMultiSelect){
          // Get distinct entities 
          var newEntitiesToAdd = [] as ComponentFramework.LookupValue[];
          for (var i = 0; i < result.length; i++) {

            var entityResult = result[i];

            var optionAlreadyExists = document.getElementById(entityResult.id.toString().replace("{", "").replace("}", ""));

            if(!optionAlreadyExists){
              createOptionForEntity(entityResult.id, entityResult.name, input);
              newEntitiesToAdd.push(entityResult);
            }
          }

          // Add the fetch entities that were actually added
          if(newEntitiesToAdd && newEntitiesToAdd.length > 0){

            var oldValue = hidden.getAttribute('value')?.toString() ?? '';

            if(oldValue && oldValue.length > 0){
              var currrentRelatedEntities = JSON.parse(oldValue) as ComponentFramework.LookupValue[];
              currrentRelatedEntities.push(...newEntitiesToAdd);
              hidden.setAttribute('value', JSON.stringify(currrentRelatedEntities));
              div.dispatchEvent(new Event('change'));
            }
          
          }
        }
        else{
            input.textContent = result[0].name ?? result[0].id;
            hidden.setAttribute('value', JSON.stringify(result));
            div.dispatchEvent(new Event('change'));
        }
      }
    };
    onLookupSearch.apply(buttonAdd, [utils, definition, successFn]);
  };
  divChild.appendChild(buttonAdd);

  div.appendChild(divChild);

  const hidden = generateDefault(control, value ? JSON.stringify(value) : '');
  hidden.setAttribute('type', 'hidden');
  div.appendChild(hidden);

  return div;
}
