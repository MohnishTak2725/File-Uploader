public without sharing class BigFilesUploaderController {
    @AuraEnabled
    public static List<Folder> getAllDocumentFolders(){
        try {
            return BigFilesUploaderHelper.getAllDocumentFolders();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Id saveFile(Id parentId, String fileName, String base64Data, String contentType, String fileId) {
        try {
            if (fileId == '') {
                fileId = BigFilesUploaderHelper.saveTheFile(parentId, fileName, base64Data, contentType);
            } else {
                BigFilesUploaderHelper.appendToFile(fileId, base64Data);
            }
            return Id.valueOf(fileId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}