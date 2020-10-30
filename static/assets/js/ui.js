popups = [] //Create an empty array of popups

class Overlay {
  constructor(init_visible=false, type='static', message='') {
    this.visible = false; //Set it to it's default visibility
    this.element = $('<div>').attr("id", "overlay") //Create an overlay element
    $("body").append(this.element);
    if (init_visible) this.show();
  }

  show() { if (!this.visible) { //The class method to show it
    this.element.toggleClass("visible")
    this.visible = (!this.visible)
    if (this.type == 'loading' && this.message != '') this.startSpinner(this.message)
  }}

  hide() {
    console.log(this)
     if (this.visible) { //The class method to hide it
      this.element.toggleClass("visible")
      this.visible = false
      this.stopSpinner()
  }} 

  startSpinner(message) {
    this.type='loading'
    this.loading_ring_container = $("<div>").attr("id", "loading-popup").attr("class", "visible").append(
      $("<div>").attr("id", "loading-popup-ring")).append(
      $("<p id='loading-popup-message'></p>").text(message)
    )
    $("body").append(this.loading_ring_container)
  }

  stopSpinner() {
    this.type = 'static';
    console.log("Stopping poo spinner");
    this.loading_ring_container.remove();
  }

  destroy() {$("body").remove(this.element)}
}

class PopupButton {
  constructor(text='', name='', style=0, on_click = function() {}, enabled=true) {
    this.text = text, this.name = name, this.style = style, this.enabled = enabled, this.on_click = on_click
    this.generate_element()
  }
  disable() { if (this.enabled) { 
    console.log("Disabled button")
    this.button_element.toggleClass("disabled");
    this.enabled = false;
  }}
  enable() { if (!this.enabled) { 
    console.log("enabled button")
    this.button_element.toggleClass("disabled");
    this.enabled = true;
  }}
  generate_element() {
    let button_obj = this;
    this.button_element = $("<div>").attr("class", "button style-" + ["one","two"][this.style] + " "+ this.name + "-button");
    if (!this.enabled) this.button_element.addClass("disabled");
    this.button_element.on("click", function() {
      if (button_obj.enabled) button_obj.on_click()
    })
    this.button_span = $("<span>" + this.text +  "</span>");
    this.button_element.append(this.button_span);
    return $(this.button_element);
  }
}

class Popup {
  constructor(title='', name='', closeable=true, open = false) {
    this.title = title, this.name = name, this.closeable = closeable, this.open = open, this.bottom_buttons = [];
    this.content_container = $("<div class='popup-window-content'></div>");
    if (this.open) this.show();
  }
  close() {
    this.element.remove();
    page_overlay.element.on("click", function() {}); //Reset the overlay onclick
  }
  show() {
    console.log("displaying popup")
    page_overlay.show(); //Enable the popup overlay if not already enabled



    //Create the frame:
    this.element = $("<div id='" + this.name + "-container' class='popup-window-container'></div>");
    this.popup_window = $("<div class='popup-window visible'></div>")
    this.element.append(this.popup_window)

    //Generate titlebar:
    this.titlebar = $("<div class='popup-window-titlebar'></div>")
    this.popup_window.append(this.titlebar);

    //Put in title text
    this.titlebar.append($("<span class='popup-window-title'>" + this.title + "</span>"));

    //Add close button
    if (this.closeable) {
      let popup_obj = this;
      this.close_button = $("<span class='popup-window-close'>X</span>").on("click", function() {
        popup_obj.close();
      });
      this.titlebar.append(this.close_button);
      page_overlay.element.on("click", function() {
        page_overlay.hide();
        popup_obj.close();
      }) //Handle closing the window
    }

    //Add an empty frame for content
    
    this.popup_window.append(this.content_container);


    if (this.bottom_buttons.length > 0) { //There are bottom buttons, include a bar
      this.bottom_bar = $("<div class='popup-window-bottombar'></div>");
      this.bottom_button_container = $("<div id='popup-window-bottom-button-container'></div>");
      this.bottom_bar.append(this.bottom_button_container);
      
      for (var button_id = 0; button_id < this.bottom_buttons.length; button_id++) { //Add each button
        this.bottom_button_container.append(this.bottom_buttons[button_id].generate_element())
        console.log("added button")
      }

      this.popup_window.append(this.bottom_bar);
    }
    $("body").append(this.element);
  }
}

class ErrorScreen { //An object that creates an overlay with basic error popup
  constructor(error_message, overlay=page_overlay, closeable=true) {
    this.overlay = overlay
    this.popup = new Popup("Error", "error-popup", closeable)
    let error_screen_obj = this;
    error_screen_obj.popup.bottom_buttons[0] = new PopupButton("Dismiss", "error-close-button", 0, function() {
      error_screen_obj.popup.close()
      error_screen_obj.overlay.hide();
    });
    this.popup.show()
    this.popup.content_container.append($("<p>").attr("class", "error-popup-text").text(error_message))
  }
  hide() {
    this.popup.close();
    this.overlay.hide();
  }
}

$(document).ready(function() {
  page_overlay = new Overlay(); //Create the page overlay
});