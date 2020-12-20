var current;
var gr = new GlideRecord('sc_req_item');
if (gr.get('your sys_id here')) {
    current = gr;
}

var count = 0;
for (vars in current.variable_pool) {
    count++;
    break;
}

var hasVars = count > 0; //check that this record has variables

if (hasVars) {//If a variable pool exists then collect variables with valid content
    var table = current.getTableName();
    var itemVars = current.variables.getElements(true);

    for (var i = 0; i < itemVars.length; i++) {
        var varToUse = itemVars[i];
        var isMultiRow = varToUse.isMultiRow();
        if (isMultiRow) {
            var vCount = varToUse.getRowCount();
            if (vCount > 0) {
                var rows = varToUse.getRows();
                var vId = itemVars[i].getLabel();

                for (var j = 0; j < varToUse.getRowCount(); j++) {
                    var row = rows[j];
                    var cells = row.getCells();

                    for (var k = 0; k < cells.length; k++) {
                        var cell = cells[k];
                        gs.print('Row ' + j +' - ' + cell.getLabel() + ': ' + cell);
                    }
                }
            }
        }

        else {
            var thisQuestion = varToUse.getQuestion();
            gs.print(thisQuestion.getLabel() + ': ' + thisQuestion.value.toString().trim());
        }
    }
}