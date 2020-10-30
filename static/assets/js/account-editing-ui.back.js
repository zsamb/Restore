$(document).ready(function() {
  save_enabled = false //init save_enabled as false

  //Function to toggle wether window is visible:
  function toggle_account_edit_window() {
    $("#popup-overlay").toggleClass("visible-popup-overlay")
    $("#edit-account-popup-container").toggleClass("visible-popup-window")
  }

  //Handle toggling the window:
  $("#sidebar-account-avatar, #sidebar-account-edit-link, #edit-account-popup-container .popup-window-close, .popup-cancel-button").click(function() {
    toggle_account_edit_window();
  })

  $("#popup-overlay").click(function() { //If the overlay is clicked
    //If the edit account popup is open, toggle it (close it):
    if (document.getElementById("edit-account-popup-container").classList.contains("visible-popup-window")) toggle_account_edit_window();
  })

  $('#edit-account-popup-container input').keyup(function(e){ //A key has been pressed in an input
    if (e.keyCode == 13 && save_enabled) save_account_changes(); //If enter key pressed and save enabled
    
    if (e.keyCode != 13) { //A key other than enter was pressed
      save_enabled = ($(this).val() != $(this).attr('value'));//Change the value of save_enabled
      if (save_enabled) $(".popup-save-button.disabled").removeClass("disabled"); //re-enable the button
      if (!save_enabled) $(".popup-save-button").addClass("disabled"); //Disable the button
    }
  });

  $(".popup-save-button").click(function(){if (save_enabled) save_account_changes()}) //When the save button is clicked

  function save_account_changes() {
      toggle_account_edit_window();
      showLoadingOverlay("Updating Account Information...");

      //Loop through each element in the form to create a request:
      req_body = {};
      $('#edit-account-popup-container input').each(function () { 
        //If the element has a name attribute, add it and it's value to the request:
        if ($(this).attr('name') != undefined) req_body[$(this).attr('name')] = $(this).val(); 
      });
      
      fetch("/api/user/cookie/update",{
        method: 'PATCH',
        body: JSON.stringify(req_body),
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
      }).then(res => {res.json().then((body) => {
          if (body['error']) {
            cancelLoadingOverlay();
            showErrorOverlay("Server error");
          } else {
            //Update the ui with the new details:
            $('#edit-account-popup-container input').each(function () { //Loop through each element in the form
              name_attr = $(this).attr('name'); //Get the name of the input
              $(this).text(body[name_attr]).attr('value', body[name_attr]); //Set the text and value
            });
            //Update other elements:
            $("#sidebar-account-name").text(body['first_name'] + " " +  body['last_name']);
            $("#sidebar-account-role").text(body['job_title']);

            cancelLoadingOverlay(); //Give the user their screen back
          }
        })});
  }
})
