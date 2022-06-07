const goodselect = ($parentElement, options) => {
    //console.log('goodselect', $parentElement, options)
    let $selectorWidth = options["selectorWidth"] || 100;
    let $marginRight = options["marginRight"] || '0';
    let $marginLeft = options["marginLeft"] || '0';
    let $container;
    let $selectedValue;
    let $list;
    let $optionsElements;
    let selectedOption;
    const placeholder = options["placeHolder"] || 'Please Select';

    const setupDomElement = () => {
        $container = document.createElement('div')
        $container.classList.add('goodselect')
        $container.setAttribute("tabindex", 0)

        $selectedValue = document.createElement('div')
        $selectedValue.classList.add('selected-value')
        $selectedValue.style.width = $selectorWidth;
        $selectedValue.style.marginRight = $marginRight;
        $selectedValue.style.marginLeft = $marginLeft;

        $list = document.createElement('div')
        $list.classList.add('list')

        $optionsElements = options.availableOptions.map((availableOption) => {
            const $element = document.createElement('div')
            $element.classList.add('list-option')
            $element.innerText = availableOption.name;
            $element.dataset.id = availableOption.id;
            return $element;
        })

        const emptyListOption = document.createElement('div')
        emptyListOption.innerText = placeholder;
        emptyListOption.classList.add("list-option");

        $optionsElements = [emptyListOption, ...$optionsElements]

        $parentElement.append($container)
        $container.append($selectedValue)
        $container.prepend($list)
        $list.append(...$optionsElements)
    }

    const setSelectedOption = (selectedOptionId, isInitialSelect = false) => {
        if (selectedOptionId === null || selectedOptionId === undefined) {
            selectedOption = null;
            $selectedValue.innerText = placeholder;
            if (!isInitialSelect) options.onOptionChange(null);
            return;
        }
        selectedOption = options.availableOptions.find(
            (availableOption) => availableOption.id == selectedOptionId
        );
        if (selectedOption == undefined) {
            $selectedValue.innerText = placeholder;
            if (!isInitialSelect) options.onOptionChange(selectedOption);
            console.warn('The indicated selectedOption:',selectedOptionId ,' was not found, thus the placeholder was shown instead')
        }
        else {
            $selectedValue.innerText = selectedOption.name;
            if (!isInitialSelect) options.onOptionChange(selectedOption);
        }


    }

    const initializeListeners = () => {
        $selectedValue.addEventListener('click', () => {
            $list.classList.toggle('is-visible')
        })

        $optionsElements.forEach($optionElement => {
            $optionElement.addEventListener('click', () => {
                $list.classList.remove('is-visible');
                setSelectedOption($optionElement.dataset.id)

            })
        })
        $container.addEventListener('blur', () => {
            $list.classList.remove('is-visible')
        })
    }
    setupDomElement();
    setSelectedOption(options.selectedOptionId, true);
    initializeListeners();
}