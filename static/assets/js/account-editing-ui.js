class AccountEditPopup {
  constructor(target='me') {
    this.visible = false;
    this.target = target;
  }
  open() {
    let popup_obj = this;
    //First we need to open a loading screen while we load stuff in
    page_overlay.show()
    page_overlay.startSpinner("Fetching Account Information...")
    //Make a request for our data:

    fetch("/api/user/me",{
      method: 'GET',
      headers: {
          'Authorization': 'Bearer ' + document.cookie.split("token=")[1].split(";")[0]
      },
    }).then(res => {res.json().then((body) => {
      if (body['error']) {
        console.log(body['error'])
        save_error_screen = new ErrorScreen("Server error");
      } else {
        //Generate the ui with the new details:
        this.popup = new Popup("Edit Account", "account-edit-popup", true, false); //Create the popup object
        this.form_elem = $("<form>")
        
        //Create the personal details section of the form:
        this.form_elem.append("<h2>Personal Details</h2>");
        this.first_name = $("<div>").attr("class", "form-input-container").append(
          $("<label>").attr("for", "account-first-name-edit").text("First Name:")).append(
          $("<input>").attr("id", "account-first-name-edit").attr("name", "first_name").attr('value',body["first_name"]))
        
        this.last_name = $("<div>").attr("class", "form-input-container").append(
          $("<label>").attr("for", "account-last-name-edit").text("Last Name:")).append(
          $("<input>").attr("id", "account-last-name-edit").attr("name", "last_name").attr('value',body["last_name"]))

        this.email = $("<div>").attr("class", "form-input-container").append(
          $("<label>").attr("for", "account-email-edit").text("E-mail Address:")).append(
          $("<input>").attr("id", "account-email-edit").attr("name", "email").attr("type", "email").attr('value',body["email"]))

        this.form_elem.append($("<div>").attr("class", "form-collection").append($("<div class='form-row popup-row'>").append(
          this.first_name).append(this.last_name)
        ).append(this.email));
      
        //Create the password reset section of the form:
        this.form_elem.append("<h2>Change Password</h2>");
        this.old_pass_elem = $("<div>").attr("class", "form-input-container").append(
          $("<label>").attr("for", "old-password-edit").text("Old Password:")).append(
          $("<input>").attr("id",  "old-password-edit").attr("name", "old_password").attr("type", "password").attr('value',""))
        
        this.new_pass_elem = $("<div>").attr("class", "form-input-container").append(
          $("<label>").attr("for", "new-password-edit").text("New Password:")).append(
          $("<input>").attr("id",  "new-password-edit").attr("name", "new_password").attr("type", "password").attr('value',""))

        this.confirm_pass_elem = $("<div>").attr("class", "form-input-container").append(
          $("<label>").attr("for", "confirm-password-edit").text("Confirm Password:")).append(
          $("<input>").attr("id",  "confirm-password-edit").attr("name", "confirm_password").attr("type", "password").attr('value',""))

        this.form_elem.append($("<div>").attr("class", "form-collection").append(
          this.old_pass_elem).append(this.new_pass_elem).append(this.confirm_pass_elem)
        );

        //Create the profile picture section of the form:
        this.photo_column = $("<div>").attr("id", "account-photo-edit-container")
        this.photo_column.append($("<h2>").text("Profile Picture:"))
        this.photo_collection = $("<div>").attr("class", "form-collection").append(
          $("<img>").attr("id", "account-photo-edit-image").attr("src", "/api/user/cookie/picture")
        )
      
        //Add the buttons to the photo section
        this.photo_column.append(this.photo_collection.append(
          $("<div>").attr("id", "account-photo-edit-button-container").append(
            $("<div>").attr("class", "button style-two").append($("<span>").text("Remove Photo"))).append(
            $("<div>").attr("class", "button style-one").append($("<span>").text("Replace Photo")))
          )
        )
      
        //Add the form and photo column to the popup
        this.popup.content_container.append($("<div>").attr("class", "popup-row").append(this.form_elem).append(this.photo_column));
        
        //Add the cancel and save button to the popup

        this.save_button = new PopupButton('Save', 'account-edit-save-button', 0, function() {
          popup_obj.save_changes() //If enabled, then save changes on click
        }, false)
        this.cancel_button = new PopupButton('Cancel', 'account-edit-cancel-button', 1, function() {
          popup_obj.popup.close()
          page_overlay.hide()
        })
        this.popup.bottom_buttons = [this.save_button, this.cancel_button];

        //On edit of inputs in popup:
        this.popup.content_container.find("input").keyup(function(e){ //A key has been pressed in an input
          console.log("key detected")
          if (e.keyCode == 13 && popup_obj.save_button.enabled) popup_obj.save_changes(); //If enter key pressed and save enabled
          if (e.keyCode != 13) { //A key other than enter was pressed
            if (($(this).attr('value') != $(this).val())) popup_obj.save_button.enable();  //Value is different to original, enable save
            if (($(this).attr('value') == $(this).val())) popup_obj.save_button.disable(); //Value is same as original, disable save
          }
        });

        //Cancel the loading spinner:
        page_overlay.stopSpinner();
        //Finally, show the popup
        this.popup.show();
      }
    })});
  }
  close() {this.popup.close()}
  save_changes() {
    this.close()//Close the popup
    page_overlay.startSpinner("Saving changes...") //show the saving changes spinner

    let req_body = {};
    this.popup.content_container.find("input").each(function(){ //Loop through each element in the form
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
            page_overlay.hide() //Hide the saving overlay
            save_error_screen = new ErrorScreen("Server error");
          } else {
            //Update other elements:
            $("#sidebar-account-name").text(body['first_name'] + " " +  body['last_name']);
            $("#sidebar-account-role").text(body['job_title']);
            page_overlay.hide() //Hide the saving overlay
          }
        })});
    
  }
}

$(document).ready(function() {
  $("#sidebar-account-avatar, #sidebar-account-edit-link").on("click", function() { //Creation of popup
    account_edit_popup = new AccountEditPopup()
    account_edit_popup.open()
  }) 
})
