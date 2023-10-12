import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

import getAllDocumentFolders from "@salesforce/apex/BigFilesUploaderController.getAllDocumentFolders";
import saveFile from "@salesforce/apex/BigFilesUploaderController.saveFile";

const CHUNK_SIZE = 1024 * 1024; // File chunk size is 2mb

export default class BigFilesUploader extends LightningElement {
    @api recordId;

    @track hideShow = {
        showFolderSelection: false,
        isUploadDisabled: true,
        isSaveDisabled: true,
        isCancelDisabled: true,
        showLoadingSpinner: false
    };
    @track foldersList = [{label: "", value: ""}];
    objectsList = [
        {label: 'Attachment', value: 'Attachment'},
        {label: 'Document', value: 'Document'},
        {label: 'Files', value: 'ContentVersion'}
    ];
    @track files = [];
    
    selectedObject = '';
    selectedFolder = '';
    filename;
    filetype;
    file;
    fileContents;
    base64;
    dataStart;

    // Generic toast message handler
    showToast(title, message, variant, mode) {
        const toastEvent = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: mode
        });
        this.dispatchEvent(toastEvent);
    }

    handleChangeObject(event){
        this.selectedObject = event.target.value;
        if (this.selectedObject === 'Document') {
            getAllDocumentFolders().then((result) => {
                result.forEach((element) => {
                    let folder = {
                        label: element.Name,
                        value: element.Id
                    };
                    this.foldersList = [...this.foldersList, folder];
                });
            });
            this.hideShow.showFolderSelection = true;
            this.hideShow.isUploadDisabled = true;
        } else {
            this.hideShow.showFolderSelection = false;
            this.hideShow.isUploadDisabled = false;
        }
    }

    // Updates selected folder Id
    handleChangeFolder(event) {
        this.selectedFolder = event.target.value;
        if(this.selectedFolder){
            this.hideShow.isUploadDisabled = false;
        } else {
            this.hideShow.isUploadDisabled = true;
        }
    }

    clearSelection(){
        this.files = [];
        this.selectedObject = '';
        this.selectedFolder = '';
        this.filename = '';
        this.file = '';
        this.fileContents = '';
        this.base64 = '';
        this.dataStart = '';
        this.hideShow.isUploadDisabled = true;
        this.hideShow.isSaveDisabled = true;
        this.hideShow.isCancelDisabled = true;
        this.hideShow.showLoadingSpinner = false;
        this.hideShow.showFolderSelection = false;
    }

    openFileUpload(event) {
        console.log('From open file upload');
        // For single large file
        this.files = event.target.files;
        this.file = event.target.files[0];
        if(this.file){
            const reader = new FileReader();
            // eslint-disable-next-line no-loop-func
            reader.onload = () => {
                this.filename = this.file.name;
                this.filetype = this.file.type;
                this.fileContents = reader.result;
                this.base64 = 'base64,';
                this.dataStart = this.fileContents.indexOf(this.base64) + this.base64.length;
                this.fileContents = this.fileContents.substring(this.dataStart);
            };
            reader.readAsDataURL(this.file);
            this.hideShow.isSaveDisabled = false;
            this.hideShow.isCancelDisabled = false;
        } else {
            this.hideShow.isSaveDisabled = true;
            this.hideShow.isCancelDisabled = true;
        }
    }

    uploadProcess() {
        console.log('From upload process');
        // For single large file
        this.hideShow.showLoadingSpinner = true;
        let startPosition = 0;
        let endPosition = Math.min(this.fileContents.length, startPosition + CHUNK_SIZE);
        this.uploadInChunk(this.fileContents, startPosition, endPosition, '');
    }

    uploadInChunk(fileContents, startPosition, endPosition, attachId){
        console.log('From upload in chunk');
        // For single large file
        var getchunk = fileContents.substring(startPosition, endPosition);
        saveFile({
            parentId: this.recordId,
            fileName: this.filename,
            base64Data: encodeURIComponent(getchunk),
            contentType: this.filetype,
            fileId: attachId
        }).then( result => {
            attachId = result;
            startPosition = endPosition;
            endPosition = Math.min(fileContents.length, startPosition + CHUNK_SIZE);
            if (startPosition < endPosition) {
                this.uploadInChunk(fileContents, startPosition, endPosition, attachId);
            } else {
                this.showToast(
                    "SUCCESS",
                    "File uploaded successfully",
                    "success",
                    "pester"
                );
                this.clearSelection();
            }
        });
    }
}