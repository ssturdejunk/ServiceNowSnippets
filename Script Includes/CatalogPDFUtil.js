var CatalogPDFUtil = Class.create();
CatalogPDFUtil.prototype = {
	initialize: function() {
	},

	packageVarsInPDF: function(current){
		var filename = current.number + '.pdf'; // set the file name
		var table = current.getTableName(); // use the current table
		var table_sys_id = current.getUniqueValue(); // get the current record sys_id
		var footer = "Here's the footer text"; //set the footer text
		var variableContent = this._getVarSet(current); // get variables in HTML format from custom method below

		var formAPI = new global.GeneralFormAPI(filename, table, table_sys_id); // create the form object from our strings above

		formAPI.setDocument(null,null, footer, '1', '1', 'a4'); // parameters here are (header image, footer image, footer text, header alignment , footer alignment, paper size) note: alignments are (0==left, 1==center, 2==right)

		formAPI.createPDF(variableContent); // this accepts a second parameter of pages, but I haven't found it helpful
	},

	_getVarSet: function(current) {
		var lastVarSet = ''; // tracking variable for extra rows
		var thisVarSet = ''; // tracking variable for extra rows
		var hasVars = this.recordHasVars(current); // check that this record has variables

		if (hasVars) {//If a variable pool exists then collect variables with valid content
			//create the start of the variable set HTML that is used in creating the PDF
			var variableSet = '';
			variableSet += "<body><h1>Details for record#: "; // page heading
			variableSet += current.number; // page heading
			variableSet += "</h1><br>"; // page heading
			variableSet += "<table border="; // table to store variable names and values
			variableSet += '"1"><tr bgcolor="pink"><th>Field Name</th><th>Value</th></tr>'; // table header row

			var table = current.getTableName(); // get the table name for this record
			var itemVars = current.variables.getElements(true); // grab all variables for this record

			for (var i = 0; i < itemVars.length; i++) { // loop through variables
				var varToUse = itemVars[i]; //grab the next variable in the array
				var isMultiRow = varToUse.isMultiRow(); // check to see if it's a Multi Row Variable Set (MRVS)

				if (isMultiRow) { // specific handling for MRVS
					var vCount = varToUse.getRowCount(); // how many rows are in the MRVS

					if (vCount > 0) { // if there are rows (meaning skip empty MRVS)
						var rowHeaders = []; // array for column labels
						var rowValues = []; // array for column values
						var pushValues = []; // temporary array for use through out the loop
						var rows = varToUse.getRows(); // grab the rows from the MRVS
						var vId = itemVars[i].getLabel(); // get the name of the MRVS

						variableSet += '<tr><td colspan="2" align="center"><h2>'; // fill the whole html table row and enlarge the font
						variableSet += vId; // post the variable set name
						variableSet += '</h2></td></tr>'; // close the html table row
						variableSet += '<tr><td colspan="2" align="center">'; // fill the whole html table row and enlarge the font
						variableSet += "<table border="; // table to store variable names and values
						variableSet += '"1"><tr bgcolor="pink">'; // set table row background color

						for (var j = 0; j < varToUse.getRowCount(); j++) { // loop through the MRVS rows
							var row = rows[j]; // get the next row
							var cells = row.getCells(); // get the cells from the row we grabbed
							rowValues.push(cells); // push the cell values array into the rowValues array

							for (var k = 0; k < cells.length; k++) { // loop through the cells in the current row
								var cell = cells[k]; // get the next cell
								pushValues.push(cell.getLabel()); // grab the cell label and place it in the temporary array
							}

							rowHeaders.push(pushValues); //put the temporary values into the header array
							pushValues = []; // clear the temporary array
						}

						rowHeaders = rowHeaders[0]; // we only need one set of headers, so make the headers equal to only the first set

						for (header = 0; header < rowHeaders.length; header++) { // loop through the header array to form the HTML table header for the MRVS
							variableSet += '<th>'; // open the header 
							variableSet += rowHeaders[header]; // print the next header
							variableSet += '</th>'; // close the header
						}
						variableSet += '</tr>'; // close the header row

						for (row = 0; row < rowValues.length; row++) { // loop through the rows
							variableSet += '<tr>'; // open a new table row
							for (value = 0; value < rowValues[row].length; value++) { //loop through the current row values
								variableSet += '<td>'; // open the cell
								variableSet += rowValues[row][value]; // print the value
								variableSet += '</td>'; // close the cell
							}
							variableSet += '</tr>'; // close the table row
						}
						variableSet += '</table></td></tr>'; // close the html table row
					}
				}

				else{ // if this wasn't an MRVS...
					var thisQuestion = varToUse.getQuestion(); // Get the question object record
					thisVarSet = this._getGlideRecordDisplayValue('item_option_new', thisQuestion.id, 'variable_set'); // set tracking variable to capture this variable source set
					var okToProceed = this._catSubcatVarSetCheck(current, thisVarSet); // make sure the variable is from a variable set associated with this business case form
					var questionType = thisQuestion.type; // get the question type (numeric value)var questionType = itemVars.type; // get the question type (numeric value)
					if(thisQuestion.value != undefined){ // if there is a value
						var questionValue = thisQuestion.value.toString().trim(); // clean it up for printing
					}

					if(okToProceed && (questionType != 19 && questionType != 20 && questionType != 24) && ((questionValue != false && questionValue != 'false') || questionType == 11) && (questionValue != ''  || questionType == 11)){ // if above is true, continue forward (removes variables with empty values, and containers, but displays false if checkbox was empty)

						var questionOrder = this._getQuestionValue(current.getUniqueValue(), thisQuestion.id, 'order'); // get the sequence for this item
						var recordQuestion = thisQuestion.getLabel().trim(); // get the trimmed question text, not name
						var recordValue = ''; // open string variable to capture correct response value

						if(questionType == 8){ // if this is reference variable, get the reference display value, not just the value which is a sysid
							var refTableName = this._getGlideRecordDisplayValue('item_option_new', thisQuestion.id, 'reference'); // get the reference variable target table
							var refRecord = questionValue; // get the reference variable sysid
							recordValue += this._getGlideRecordDisplayValue(refTableName, refRecord); // call function to pull display value and set our record value to this.
						}
						else{
							recordValue += questionValue; // otherwise, we use the value stored in the question response string
						}

						if(thisVarSet != lastVarSet){ // if this is a different Variable set
							var varSetName = this._getGlideRecordDisplayValue('item_option_new_set', thisVarSet); // get the var set display name
							variableSet += '<tr><td colspan="2" align="center"><h2>'; // fill the whole html table row and enlarge the font
							variableSet += varSetName; // post the variable set name
							variableSet += '</h2></td></tr>'; // close the html table row
						}

						if(thisQuestion.type == 11){ // if this is a label
							variableSet += '<tr><td colspan="2" align="center"><h3>'; // fill the whole html table row and enlarge the font
							variableSet += recordQuestion; // only post the record question
							variableSet += '</h3></td></tr>'; // close the html table row
						}
						else{ // every other valid variable
							variableSet += '<tr><td>'; // open new table row
							variableSet += recordQuestion; // column 1 is the question text
							variableSet += '</td><td>'; // close column 1 and open column 2
							variableSet += recordValue; // column 2 is the record value
							variableSet += '</td></tr>'; // close column 2 and the row
						}
						lastVarSet = thisVarSet; // keep track of which variable set we just went through
					}
				}
			}
		}
		variableSet += "</table></body>"; // after all variables are in, close the table and the body of the HTML

		return variableSet; // send HTML back to be used in PDF Creation
	},

	/*
	function to determine if a record has variables
	@param = current is a gliderecord object
	returns boolean t/f
	*/
	recordHasVars: function(current){ 
		var returnValue = false;
		var count = 0;
		for (vars in current.variable_pool) {
			count++;
			break;
		}
		if(count > 0){
			returnValue = true;
		}

		return returnValue;
	},

	/*
	function get display value of any glide record
	@param table = string table name to be used in gliderecord
	@param record = string sysid of record to be pulled
	@param field = optional string field name if not specified, returns display value. If used, returns specified field value
	returns string
	*/
	_getGlideRecordDisplayValue: function(table, record, field){
		var returnValue = '';
		var gr = new GlideRecord(table);
		if(gr.get(record))
			if(field){
				returnValue = gr[field];
			}
			else{
				returnValue = gr.getDisplayValue();
			}
		return returnValue;
	},

	_getQuestionValue: function(record1, record2, field){
		var returnValue = '';
		var gr = new GlideRecord('question_answer');
		gr.addQuery('table_sys_id', record1);
		gr.addQuery('question', record2);
		gr.setLimit(1);
		gr.query();
		while(gr.next()){
			returnValue = gr[field];
		}
		return returnValue;
	},

	/*
	function check if a variable is in a variable set associated with the form selected
	@param current = gliderecord object (case)
	@param itemVars = gliderecord object (variable)
	returns string
	*/
	_catSubcatVarSetCheck: function(current, varSet){
		returnValue = false;
		var currentCategory = current.category; // get the case category
		var currentSubCategory = current.subcategory; // get the case subcategory
		varSet =varSet.toString().trim();
		// 		var ourItemSet = itemVars.question.ref_item_option_new.variable_set.toString().trim(); // trim the variable set sysID

		if(varSet == null || varSet == 'null' || varSet == undefined || varSet == 'undefined' || varSet == ''){ // if variable set sysid is invalid
			returnValue = true; // include it in the pdf package
			return returnValue; 
		}

		/* subcategories for business case
			cat1 = 610
			cat2 = 620
			cat3 = 630
			*/
		var cat1VarSets = [ // variable set sysids associated with cat1
			"b8bc76b3db10a410e564027ed39619ed", 
			"3ad4c3f2db871410e564027ed39619fd", 
			"5f5b05d9db875c10e564027ed39619c7", 
			"6dd1552b1b071810e38299ffbd4bcb72", 
			"5cc443f6db871410e564027ed3961907", 
			"1b90dd5ddb875c10e564027ed3961919", 
			"51e0112b1b071810e38299ffbd4bcb95", 
			"673d1b7bdb90a410e564027ed3961928" 
		];
		var cat2VarSets = [ // variable set sysids associated with cat2
			"9ca40bfbdb10a410e564027ed3961929", 
			"74d66da31b871810e38299ffbd4bcbdf", 
			"3ad4c3f2db871410e564027ed39619fd", 
			"5f5b05d9db875c10e564027ed39619c7", 
			"633a6d671b871810e38299ffbd4bcb1b", 
			"5cc443f6db871410e564027ed3961907", 
			"1b90dd5ddb875c10e564027ed3961919", 
			"673d1b7bdb90a410e564027ed3961928"
		];
		var cat3VarSets = [ // variable set sysids associated with cat3
			"4dbf4b3bdb50a410e564027ed3961969", 
			"aba0affedbc71410e564027ed3961965", 
			"3ad4c3f2db871410e564027ed39619fd", 
			"4e6aaed31bc7d410e38299ffbd4bcbdc", 
			"5f5b05d9db875c10e564027ed39619c7", 
			"3da808931b4f9410e38299ffbd4bcb14", 
			"7e05489f1b0f9410e38299ffbd4bcb70", 
			"5cc443f6db871410e564027ed3961907", 
			"c319811f1b43d410e38299ffbd4bcb77", 
			"f446ab37dbd0a410e564027ed39619b7"
		];
		var inCat1 = cat1VarSets.indexOf(varSet) > -1; // test index for cat1
		var inCat2 = cat2VarSets.indexOf(varSet) > -1; // test index for cat2
		var inCat3 = cat3VarSets.indexOf(varSet) > -1; // test index for cat3

		if(currentCategory == 600 && currentSubCategory == 610){ // if correct category and cat1
			if(inCat1){ // if index was true
				returnValue = true; //include the variable
			}
		}
		else if(currentCategory == 600 && currentSubCategory == 620){ // if correct category and cat2
			if(inCat2){ // if index was true
				returnValue = true;
			}
		}
		else if(currentCategory == 600 && currentSubCategory == 630){ // if correct category and cat3
			if(inCat3){ // if index was true
				returnValue = true; //include the variable
			}
		}
		return returnValue;
	},

	type: 'CatalogPDFUtil'
};