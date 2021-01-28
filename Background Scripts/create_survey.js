RECEIPIENT_GROUP = 'RECEIPIENT_GROUP_SYS_ID'; //
CATEGORY_LIST = ['SURVEY_BANK_SYS_ID1', 'SURVEY_BANK_SYS_ID2']; //

this.createSurvey();

function createSurvey(){
    var grSurvey = new GlideRecord('asmt_metric_type');
    grSurvey.newRecord();
    grSurvey.name  = 'Our Survey Name2';
    grSurvey.evaluation_method = 'survey';
    grSurvey.insert();

    var surveyCat = this.getCategory(grSurvey);
    this.pullSurveyBankQuestions(surveyCat, grSurvey);
    this.addRecipients(surveyCat);
    
    // next section publishes the survey which creates survey instances and notifies recipients
    grSurvey.publish_state = 'published';
    grSurvey.update();
    return;
}

function getCategory(survey){
        var grSurveyCats = new GlideRecord('asmt_metric_category');
        if(grSurveyCats.get('metric_type', survey.getValue('sys_id'))){
           return grSurveyCats;
        }
    return;
}

function pullSurveyBankQuestions(assessableCategory,survey){
    for(var i = 0; i < this.CATEGORY_LIST.length; i++){
        var category = this.CATEGORY_LIST[i];
        var grBank = new GlideRecord('asmt_metric');
        grBank.addQuery('category', category);
        grBank.query();
        while(grBank.next()){
           var metricValue = grBank.getValue('sys_id').toString();
           grBank.category = assessableCategory.getValue('sys_id');
           grBank.metric_type = survey.getValue('sys_id');
           var newMetric = grBank.insert();

           if(grBank.datatype == 'choice'){
               var grChoices = new GlideRecord('asmt_metric_definition')
               grChoices.addQuery('metric', metricValue);
               grChoices.query();
               while(grChoices.next()){
                   grChoices.metric = newMetric.getValue('sys_id');
                   grChoices.insert();
               }
           }
        }
        
    }
    return;
}

function addRecipients(category){
    var grUsers = new GlideRecord('sys_user_grmember');
    grUsers.addQuery('group', this.RECEIPIENT_GROUP);
    grUsers.query();
    while(grUsers.next()){
        var grRecipient = new GlideRecord('asmt_m2m_category_user');
        grRecipient.newRecord();
        grRecipient.metric_category = category.getValue('sys_id');
        grRecipient.user = grUsers.user.getValue('sys_id');
        grRecipient.insert();
    }
    return;
}