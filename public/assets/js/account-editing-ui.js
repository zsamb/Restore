$(document).ready(function() {
  save_enabled = false
  $("#sidebar-account-edit-link, #edit-account-popup-container .popup-window-close, .popup-cancel-button").click(function() {
    $("#popup-overlay").toggleClass("visible-popup-overlay")
    $("#edit-account-popup-container").toggleClass("visible-popup-window")
  })
  $("#popup-overlay").click(function() {
    if (document.getElementById("edit-account-popup-container").classList.contains("visible-popup-window")) {
      $("#popup-overlay").toggleClass("visible-popup-overlay")
      $("#edit-account-popup-container").toggleClass("visible-popup-window")
    }
  })

  $('#account-email-edit, #account-first-name-edit, #account-last-name-edit').on('keyup', function(){
    console.log("Edit Made")
    if ($(this).val() != $(this).attr('data-default-value')) { //There has been a change since original
      $(".popup-save-button.disabled").removeClass("disabled")
      save_enabled = true
    } else { //The form is identical to first render
      if (save_enabled) {
        $(".popup-save-button").addClass("disabled")
        save_enabled = false
      }
    }
  });

  $(".popup-save-button").click(function() {
    if (save_enabled) {
      $("#edit-account-popup-container").toggleClass("visible-popup-window")
      $("#popup-overlay").toggleClass("visible-popup-overlay")
      showLoadingOverlay("Updating Account Information...")
      emailInputValue    = $("#account-email-edit").val();
      forenameInputValue = $("#account-first-name-edit").val();
      lastnameInputValue = $("#account-last-name-edit").val();
      
      console.log(emailInputValue + ", " + forenameInputValue + ", " + lastnameInputValue)

      $.ajax({
        method: 'PATCH',
        url: "/api/user/me/update",
        data: {
          'email':emailInputValue
        }
      }).done(function(data) {
        console.log(data)
        cancelLoadingOverlay();
      });

    }
  })
})
