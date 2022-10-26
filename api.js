let employees;

$(document).ready(function () {
  const Url = "https://dummy.restapiexample.com/api/v1/employees";

  $.ajax({
    url: Url,
    type: "GET",
    dataType: "JSON",
    success: function (response) {
      employees = response.data;   
    },
    error: function(error){
      console.log(`Error ${error}`)
    }
  });
});

function validateInput() {
  let personalnummerEingabe = document.getElementById("personalnummer").value;
  console.log(personalnummerEingabe);

  let passwortEingabe = document.getElementById("passwort").value;
  console.log(passwortEingabe);

  if (checkEmptyInput(personalnummerEingabe, passwortEingabe)) {
    let istVorhanden = false;
    for (let i = 0; i < employees.length; i++) {
      if (employees[i].id == personalnummerEingabe 
        && employees[i].employee_name == passwortEingabe) {
        alert('Wilkommen ' + employees[i].employee_name + '!');
        istVorhanden = true;
      }
    }

    if (!istVorhanden) {
      alert('Fehlerhafte Eingabe!')
    }
  }
}

function checkEmptyInput(personalnummerEingabe, passwortEingabe) {
  let personalnummerIstEingegeben = true;
  if (personalnummerEingabe == '') {
    document.getElementById("personalnummer").style.boxShadow = "0px 0px 0px 1px #DD0051 inset";
    personalnummerIstEingegeben = false;
  } else {
    document.getElementById("personalnummer").style.boxShadow = "none";
  }

  let passwortIstEingegeben = true;
  if (passwortEingabe == '') {
    document.getElementById("passwort").style.boxShadow = "0px 0px 0px 1px #DD0051 inset";
    passwortIstEingegeben = false;
  } else {
    document.getElementById("passwort").style.boxShadow = "none";
  }

  if (personalnummerIstEingegeben && passwortIstEingegeben) {
    return true;
  } else {
    return false;
  }
}