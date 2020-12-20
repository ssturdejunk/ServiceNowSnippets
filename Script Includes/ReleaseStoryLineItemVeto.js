gs.include('PrototypeServer');
gs.include('AbstractTransaction');

var ReleaseStoryLineItemVeto = Class.create();

ReleaseStoryLineItemVeto.prototype =  Object.extendsObject(AbstractTransaction, {

   execute : function() {
       var id = this.request.getParameter('sysparm_id');
       var state = this.request.getParameter('sysparm_state');
	   var stackID = this.request.getParameter('sysparm_nameofstack');
	   var approval = this.request.getParameter('sysparm_approval');
	   var url = "sysapproval_approver.do?sys_id="+approval;
	   //gs.addErrorMessage("approval from script include =" + approval + " | url = " + url);
	   this.response.sendRedirect(url);
	   
       var gr = new GlideRecord("rm_story");
       gr.addQuery('sys_id', id);
       gr.query();
       if (gr.next()) {
           if (state == 'reject'){
              this._veto(gr,url);}
           else{
              this._accept(gr,url);}
		  
			
			  return false;
		   
       }
       gs.addErrorMessage(gs.getMessage("Could not reject release story as it could not be located"));
       return "home.do";
   },

   _veto : function(gr,url) {
       gr.setValue("approval", 'rejected');
       gr.setValue("state", -6);
	   gs.setRedirectURL(url);
       gr.update();
       gs.getSession().addInfoMessage(gs.getMessage("Release story {0} has been reset to draft", gr.number));
   },

   _accept : function(gr,url) {
       gr.setValue("approval", "requested");
	   gr.setValue("state", 1);
	   gs.setRedirectURL(url);
       gr.update();
       gs.getSession().addInfoMessage(gs.getMessage("Release story {0} has been accepted", gr.number));
   }
});