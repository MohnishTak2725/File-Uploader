public without sharing class BigFilesUploaderHelper {
    /**
     * @description This method is used to get all folders with there respective Ids
     * @return list of folders whose type is document
     */
    public static List<Folder> getAllDocumentFolders() {
        try {
            return [
                SELECT Id, Name, DeveloperName, Type
                FROM Folder
                WHERE Type = :BigFilesUploaderConstants.DOCUMENT
                ORDER BY Name ASC
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public static Id saveTheFile(Id parentId, String fileName, String base64Data, String contentType) {
        try {
            base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');
            Attachment oAttachment = new Attachment();
            oAttachment.parentId = parentId;
            oAttachment.Body = EncodingUtil.base64Decode(base64Data);
            oAttachment.Name = fileName;
            oAttachment.ContentType = contentType;
            insert oAttachment;        
            return oAttachment.Id;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public static void appendToFile(Id fileId, String base64Data) {
        try {
            base64Data = EncodingUtil.urlDecode(base64Data, 'UTF-8');        
            Attachment a = [
                SELECT Id, Body
                FROM Attachment
                WHERE Id = : fileId
            ];
            String existingBody = EncodingUtil.base64Encode(a.Body);        
            a.Body = EncodingUtil.base64Decode(existingBody + base64Data);        
            update a;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}