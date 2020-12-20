// Action name == 'message_confirmation' NOTE: MUST BE UNIQUE - if you use the same name on multiple UI Actions the wrong one can be invoked on return from UI page
// client == true
// Onclick == confirmationMessageContent() 

function confirmationMessageContent(){ // onclick client function
    //These variables are used to break the text into blocks when we send to the UI page
    var gmIntro ='Below are the contents of your message: \n';
    var gmSubject = g_form.getValue('u_custom_subject');
    var gmBody = g_form.getValue('description');
    var gmBody2 = g_form.getValue('resolution');
    var gmBody3 = g_form.getValue('u_custom_message');
    var gmRecipients = g_form.getValue('caller');
    var gmCIList = g_form.getValue('cmdb_ci');
    
    var dialog = new GlideModal('message_confirm_modal', false, 600); // invoke the GlideModal object - parameters (name of the UI page your calling, , pixel width)
    dialog.setTitle(new GwtMessage().getMessage('Message Confirmation')); // set the Title attribute of the 
    // send parameters with specific names so we can set up the blocks of text on the UI Page
    dialog.setPreference("sysparm_intro", gmIntro); 
    dialog.setPreference("sysparm_subject", gmSubject);
    dialog.setPreference("sysparm_body", gmBody);
    dialog.setPreference("sysparm_body2", gmBody2);
    dialog.setPreference("sysparm_body3", gmBody3);
    dialog.setPreference("sysparm_recipients", gmRecipients);
    dialog.setPreference("sysparm_ciList", gmCIList);
    dialog.render(); // send to the UI Page
  }
  
  // Below is server side actions that will be executed if the UI page sends back a response to continue. These will not be executed if the modal is canceled or 'x'ed out
  if(typeof window == 'undefined') {
    new OurEmailUtils().sendEmail(current); 
    setRedirect();
  }
  
  function setRedirect() {
    current.update();
    action.setRedirectURL(current);
  }