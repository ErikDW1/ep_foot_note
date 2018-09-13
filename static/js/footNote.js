var _, $;

var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');

var cssFiles = ['ep_foot_note/static/css/styles.css'];


function aceCreateDomLine(name, context){
  //debugger;
  var cls = context.cls;
  var domline = context.domline;
  var footnote = /(?:^| )fnss:([A-Za-z0-9]*)/.exec(cls);
  var isPresent;

 	if (footnote){
 		isPresent = (footnote[1] == 'fn');
	}

  if (isPresent){
    var modifier = {
      extraOpenTags: '<sup>',
      extraCloseTags: '</sup>',
      cls: cls
    };
    return [modifier];
  }
  return [];
}



function postAceInit(hook,context){
	var hs = $('#footnote-button');
    hs.on('click', function(){
	     fnPopupManager.showPopup(context);

  	});
}



function aceInitialized(hook,context){
	var editorInfo = context.editorInfo;
	editorInfo.ace_addFootNote = _(addFootNote).bind(context);
}


/*
 * Method which adds the superscript next to the cursor and also adds the footnote to the bottom of the page
 */
function addFootNote(footNoteText){

	var rep = this.rep;
	var documentAttributeManager = this.documentAttributeManager;

	 //find the foot note counter...
	 var footNoteCounter = 1;
	 //find the last line and add the superscript and the text...
	 var lastLineNo = this.rep.lines.length() - 1;
	 var fnssPresent =  this.documentAttributeManager.getAttributeOnLine(lastLineNo, "fnss");
	 if(fnssPresent){
		footNoteCounter = parseInt(this.rep.lines.atIndex(lastLineNo).text.split(" ")[0]);
		if(!isNaN(footNoteCounter))
			footNoteCounter++;
	 }

	//set the superscript after the selection
	var start = rep.selStart;
	var end = rep.selEnd;
	this.editorInfo.ace_replaceRange(end,end,footNoteCounter+'');
	this.rep.selStart = end;
	this.rep.selEnd = [end[0],end[1]+(footNoteCounter+'').length];
    this.editorInfo.ace_setAttributeOnSelection("fnss","fn");

	 //Add the foot note to the end of the page
	 var len = this.rep.lines.atIndex(lastLineNo).text.length;
	 if(len > 0){//means there is some text there.... so press enter and add the foot note
		this.editorInfo.ace_performSelectionChange([lastLineNo,len], [lastLineNo,len]);
		this.editorInfo.ace_doReturnKey();
		//increment the last line index , since Enter key is pressed..
		lastLineNo++;
		//get lenth again
		len = this.rep.lines.atIndex(lastLineNo).text.length;
	 }

	 this.editorInfo.ace_replaceRange([lastLineNo,0],[lastLineNo,len],footNoteCounter + ' '+footNoteText);
	 this.rep.selStart = [lastLineNo,0];
	 this.rep.selEnd = [lastLineNo,(footNoteCounter+'').length];

	 this.editorInfo.ace_setAttributeOnSelection("fnss","fn");

}

function aceAttribsToClasses(hook,context){
	if(context.key == "fnss"){
		return ['fnss:fn'];
	}
}

function aceRegisterBlockElements(){
	return [];
}


function aceEditorCSS(){
  return cssFiles;
}



/**
 * Popup manager object which creates the popup to get the footnote text
 * Also calls the addfootnote method from footnote context
*/

var fnPopupManager = (function FootNotePopupManager(){

	return {
		container:null,

		insertPopupContainer:function(){
			 $('iframe[name="ace_outer"]').contents().find("#outerdocbody").prepend('<div id="footNotePopup" class="fn-popup" style="display: block;"><div><input id="fnInput" type="text"/></div> <div style="padding-top:10px"><input type="button" id="fnAdd" value="Add"/><input style="margin-left:10px" type="button" value="Cancel" id="fnCancel"/></div></div>');
  			 this.container = $('iframe[name="ace_outer"]').contents().find('#footNotePopup');//this.padOuter.find('#footNotePopup');
			 this.addEventListener();
		},

		getFootNoteContext:function(){
			return this.footNoteContext;
		},

		setFootNoteContext:function(footNoteContext){
			this.footNoteContext = footNoteContext;
		},

		showPopup:function(footNoteContext){
			//$("#footNotePopup").show();
			if(this.container == null)
				this.insertPopupContainer();
			this.container.show();
			this.setFootNoteContext(footNoteContext);
		},

		addEventListener:function(){


			//add on click event listener..
			 this.container.find('#fnAdd').on('click',function(){
				 var footNoteText = $('iframe[name="ace_outer"]').contents().find('#fnInput').val();
				 var container = $('iframe[name="ace_outer"]').contents().find('#footNotePopup');//this.padOuter.find('#footNotePopup');
				 container.hide();

				 if(footNoteText == "")return;

				 fnPopupManager.getFootNoteContext().ace.callWithAce(function(ace){
								ace.ace_addFootNote(footNoteText);
								$('iframe[name="ace_outer"]').contents().find('#fnInput').val("")
						},'addFootNote' , true);

				// fnPopupManager.getFootNoteContext().callAddFootNote(this.footNoteText);
			    //var form = $(this).parent().parent();
			    //$('iframe[name="ace_outer"]').contents().find('#comments').find('#newComment').addClass("hidden").removeClass("visible");

  			});
			//cancel click event listener
			this.container.find('#fnCancel').on('click',function(){
				 //this.footNoteText = $("#fnInput").text();
				 $('iframe[name="ace_outer"]').contents().find('#fnInput').val("")
				 var container = $('iframe[name="ace_outer"]').contents().find('#footNotePopup');//this.padOuter.find('#footNotePopup');
				 container.hide();
			    //var form = $(this).parent().parent();
			    //$('iframe[name="ace_outer"]').contents().find('#comments').find('#newComment').addClass("hidden").removeClass("visible");

  			});
		}



	}

})();




//hooks
exports.aceEditorCSS = aceEditorCSS;
exports.aceCreateDomLine = aceCreateDomLine;
exports.postAceInit = postAceInit;
exports.aceInitialized = aceInitialized;
exports.aceAttribsToClasses = aceAttribsToClasses;
exports.aceRegisterBlockElements = aceRegisterBlockElements;