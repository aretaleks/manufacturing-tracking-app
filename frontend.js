$(document).ready(() => {
  // Fetch table headers and data from the server
  $.ajax({
    url: '/getTableData',
    method: 'GET',
    success: (data) => {
      const tableHeaders = data.columns.map(column => column.COLUMN_NAME);
      const tableData = data.data;
      populateTable(tableHeaders, tableData);
      filterTable('');
    },
    error: (err) => {
      console.error(err);
    },
  });

  // Fetch and populate the initial data for the select tags
  fetchInitialDropdownData('/getMachines', 'pink-select');
  fetchInitialDropdownData('/getProducts', 'toode-list');
  fetchInitialDropdownData('/getOperations', 'operatsioon-select');
  fetchInitialDropdownData('/getOperators', 'operaator-select');

  $('#form-clear').on('click', function () {
    $('#tellimus-field').val('');
    $('#pos-field').val('');
    $('#klient-field').val('');
    $('#operaator-select').val('');
    filterTable('');
  });
});

//-------------------------------------EVENT-LISTENERS-ON-FIELDS-------------------------------

$('#pink-select').on('change', function () {
  const selectedMachine = $(this).val();
  $('#operaator-select').empty().append($('<option>', {
    value: '',
    text: 'Vali operaator',
  }));
  $('#toode-list').empty().append($('<option>', {
    value: '',
    text: 'Vali toode',
  }));
  $('#operatsioon-select').empty().append($('<option>', {
    value: '',
    text: 'Vali operatsioon',
  }));

  // Fetch and populate the dropdown menus based on the selected machine
  fetchDropdownData('/getProductsByMachine', 'toode-list', { machine: selectedMachine });
  fetchDropdownData('/getOperatorsByMachine', 'operaator-select', { machine: selectedMachine });
  fetchDropdownData('/getOperationsByMachine', 'operatsioon-select', { machine: selectedMachine });

  const filterCriteria = {
    machine: selectedMachine,
    operator: $('#operaator-select').val(),
  };
  filterTable(filterCriteria);
});

$('#operaator-select').on('change', function () {
  const selectedOperator = $(this).val();
  const filterCriteria = {
    machine: $('#pink-select').val(),
    operator: selectedOperator,
  };
  filterTable(filterCriteria);
});

//Search
$('#openPdf').on('click', function () {
  const searchString = $('#pdfInput').val();
  const digitCount = searchString.split('').reduce((count, char) => {
    if (char >= '0' && char <= '9') {
      return count + 1;
    }
    return count;
  }, 0);
  if (searchString.trim() === '') {
    alert('Palun sisesta tellimus');
  } else if (digitCount !== 5) {
    alert(`Tellimus peab sisaldama 5 numbrit.`);
  } else {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/openPdfFiles?searchString=' + searchString, true);
    xhr.responseType = 'arraybuffer'; // Set responseType to arraybuffer
    
    xhr.onload = function (e) {
      if (this.status === 200) {
        const arrayBuffer = this.response;
        const zip = new JSZip();
    
        // Load the received zip file
        zip.loadAsync(arrayBuffer).then(function (zip) {
          // Loop through the files in the zip archive
          zip.forEach(function (relativePath, file) {
            // Check if the file is a PDF
            if (relativePath.endsWith('.pdf')) {
              // Extract the PDF file as a blob
              file.async('blob').then(function (blob) {
                const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
                window.open(url, '_blank');
              });
            }
          });
        });
      } else {
        alert('Faili ei leitud');
      }
    };
    
    xhr.onerror = function () {
      alert('Error fetching data from server');
    };
    
    xhr.send();
    
  }
});

$('#openDrw').on('click', function () {
  const searchString = $('#drawingInput').val();
  const digitCount = searchString.split('').reduce((count, char) => {
    if (char >= '0' && char <= '9') {
      return count + 1;
    }
    return count;
  }, 0);
  if (searchString.trim() === '') {
    alert('Palun sisesta tellimus');
  } else if (digitCount !== 5) {
    alert(`Tellimus peab sisaldama 5 numbrit.`);
  } else {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/openDrwFile?searchString=' + searchString, true);
    xhr.responseType = 'blob';

    xhr.onload = function (e) {
      if (this.status === 200) {
        const blob = new Blob([this.response], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_tab');
      } else {
        alert('Faili ei leitud');
      }
    };

    xhr.onerror = function () {
      alert('Error fetching data from server');
    };

    xhr.send();
  }
});

// Directo
$('#tellimus-submit').on('click', function () {
  const orderNumber = $('#tellimus-field').val();
  const digitCount = orderNumber.split('').reduce((count, char) => {
    if (char >= '0' && char <= '9') {
      return count + 1;
    }
    return count;
  }, 0);
  if (orderNumber.trim() === '') {
    alert('Palun sisesta tellimus');
  } else if (digitCount !== 5) {
    alert(`Tellimus peab sisaldama 5 numbrit.`);
  } else {
    $.ajax({
      url: '/fetchClientName',
      method: 'POST',
      data: { orderNumber },
      success: (response) => {
        $('#klient-field').val(response.clientName);
      },
      error: (err) => {
        console.error('Error fetching client name:', err);
        alert('Klienti ei leitud');
      },
    });
  }
});

//--------------------------------------FORM-SUBMISSION------------------------------------------

$('#form-submit').on('click', function (e) {
  e.preventDefault();

  // Get form data
  const formData = {
    pink: $('#pink-select').val(),
    toode: $('#toode-select').val(),
    klient: $('#klient-field').val(),
    operaator: $('#operaator-select').val(),
    kogus: $('#kogus-field').val(),
    tellimus: $('#tellimus-field').val(),
    kasi: $('#kasi-select').val(),
    pos: $('#pos-field').val(),
    operatsioon: $('#operatsioon-select').val(),
    selectedDate: $('#selectedDateInput').val(),
  };

  // Field validation check
  for (const key in formData) {
    if (formData.hasOwnProperty(key)) {
      const value = formData[key];
      if (key === 'kasi') {
        continue; // Skip käsi
      }

      if (!isFieldValid(value, key)) {
        if (key === 'pos') {
          alert(`Palun sisesta positsioon.`);
        } else if (key === 'selectedDate') {
          alert(`Palun sisesta kuupäev.`);
        } else {
          alert(`Palun sisesta ${key}.`);
        }
        return;
      }
    }
  }
  // Send the form data to the server
  $.ajax({
    url: '/submitFormData',
    method: 'POST',
    data: formData,
    success: (response) => {
      console.log('Form data submitted successfully:', response);
      const filterCriteria = {
        machine: $('#pink-select').val(),
        operator: $('#operaator-select').val(),
      };
      filterTable(filterCriteria);
    },
    error: (err) => {
      console.error('Error submitting form data:', err);
    },
  });

  function isFieldValid(value, key) {
    if (key === 'tellimus') {
      // Check if tellimus contains exactly 5 digits
      const digitCount = value.split('').reduce((count, char) => {
        if (char >= '0' && char <= '9') {
          return count + 1;
        }
        return count;
      }, 0);
      if (digitCount !== 5) {
        alert(`Tellimus peab sisaldama 5 numbrit.`);
        return false;
      }
    } else {
      if ((typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
        return false;
      }
    }
    return true;
  }
});

//-----------------------------------DATA-INPUT-FUNCTIONS--------------------------------

function autoSelectOption() {
  const datalist = document.getElementById('toode-list');
  const input = document.getElementById('toode-select');
  if (datalist.options.length === 1) {
    input.value = datalist.options[0].value;
  }
}

function fetchDropdownData(url, selectId, data) {
  $.ajax({
    url: url,
    method: 'GET',
    data: data,
    success: (data) => {
      const selectElement = $('#' + selectId);
      data.forEach((option) => {
        selectElement.append($('<option>', {
          value: option,
          text: option
        }));
      });
    },
    error: (err) => {
      console.error(err);
    },
  });
  if (selectId === 'toode-list') {
    autoSelectOption()
  }
}

function fetchInitialDropdownData(url, selectId) {
  $.ajax({
    url: url,
    method: 'GET',
    success: (data) => {
      const selectElement = $('#' + selectId);
      data.forEach((option) => {
        selectElement.append($('<option>', {
          value: option,
          text: option
        }));
      });
    },
    error: (err) => {
      console.error(err);
    },
  });
}

//-----------------------------------TABLE------------------------------------------------
function populateTable(headers, data) {
  const tableContainer = document.getElementById('tableContainer');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  // Table header row
  const headerRow = document.createElement('tr');
  headers.forEach((header) => {
    const th = document.createElement('th');
    th.textContent = header;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Table data rows
  data.forEach((row) => {
    const dataRow = document.createElement('tr');
    headers.forEach((header) => {
      const td = document.createElement('td');
      const cellValue = header === 'Kuupäev' ? formatSQLDate(row[header]) : row[header];
      td.textContent = cellValue;
      dataRow.appendChild(td);
    });
    tbody.appendChild(dataRow);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tableContainer.innerHTML = '';
  tableContainer.appendChild(table);
}

function filterTable(filters) {
  $.ajax({
    url: '/getTableData',
    method: 'GET',
    data: filters,
    success: (data) => {
      const tableHeaders = data.columns.map(column => column.COLUMN_NAME);
      const tableData = data.data;
      populateTable(tableHeaders, tableData);
    },
    error: (err) => {
      console.error(err);
    },
  });
}
//-----------------------------------TABLE-FILTER-MODAL------------------------------------------
$('#openFilters').on('click', function () {
  $('#filterModal').show();
});

$('#applyFilters').on('click', function () {
  const filterData = {
    filterDate: $('#filterDate').val(),
    filterTellimus: $('#filterTellimus').val(),
    filterOperaator: $('#filterOperaator').val(),
    filterKlient: $('#filterKlient').val(),
  };
  filterTable(filterData);
  $('#filterModal').hide();
});

$('#resetFilters').on('click', function () {
  $('#filterDate, #filterTellimus, #filterOperaator, #filterKlient').val('');
  $('#filterModal').hide();
  filterTable('');
});

$('#closeButton').on('click', function () {
  $('#filterModal').hide();
});
//-----------------------------------TABLE-DATE-FORMAT--------------------------------------
function formatSQLDate(sqlDate) {
  const jsDate = new Date(sqlDate);
  const day = ("0" + jsDate.getDate()).slice(-2);
  const month = ("0" + (jsDate.getMonth() + 1)).slice(-2);
  const year = jsDate.getFullYear().toString();

  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
}
