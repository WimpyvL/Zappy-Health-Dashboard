# Database Overview

Your database consists of multiple tables that serve various functionalities. Below is a summary of each table, including its purpose and key fields.

## Tables

1. **api_logs**
   - **Purpose**: Stores logs of API requests and responses.
   - **Key Fields**: 
     - `id`: Unique identifier for each log entry.
     - `path`: The API endpoint accessed.
     - `method`: HTTP method used (GET, POST, etc.).
     - `status`: HTTP status code returned.

2. **blacklists**
   - **Purpose**: Maintains a list of blacklisted items.
   - **Key Fields**: 
     - `id`: Unique identifier for each blacklist entry.
     - `value`: The item being blacklisted.
     - `category`: Category of the blacklist entry.

3. **category**
   - **Purpose**: Stores categories for various items.
   - **Key Fields**: 
     - `id`: Unique identifier for each category.
     - `name`: Name of the category.

4. **check_in**
   - **Purpose**: Records check-in data for clients.
   - **Key Fields**: 
     - `id`: Unique identifier for each check-in.
     - `patients_id`: Reference to the client.
     - `date`: Date of the check-in.

5. **patients**
   - **Purpose**: Stores client information and records.
   - **Key Fields**: 
     - `id`: Unique identifier for each client record.
     - `first_name`, `last_name`: Client's name.
     - `email`: Client's email address.

6. **consultations**
   - **Purpose**: Records consultation details.
   - **Key Fields**: 
     - `id`: Unique identifier for each consultation.
     - `client_id`: Reference to the client.
     - `consultation_type`: Type of consultation.

7. **crisp_session**
   - **Purpose**: Manages sessions for client interactions.
   - **Key Fields**: 
     - `id`: Unique identifier for each session.
     - `patients_id`: Reference to the client.

8. **discounts**
   - **Purpose**: Stores discount information.
   - **Key Fields**: 
     - `id`: Unique identifier for each discount.
     - `code`: Discount code.
     - `amount`: Discount amount.

9. **documents**
   - **Purpose**: Manages document uploads and metadata.
   - **Key Fields**: 
     - `id`: Unique identifier for each document.
     - `file_name`: Name of the uploaded file.
     - `url`: URL of the document.

10. **email_logs**
    - **Purpose**: Logs email communications.
    - **Key Fields**: 
      - `id`: Unique identifier for each email log.
      - `patients_id`: Reference to the client.
      - `body`: Content of the email.

11. **form_requests**
    - **Purpose**: Stores form submission requests.
    - **Key Fields**: 
      - `id`: Unique identifier for each form request.
      - `patients_id`: Reference to the client.

12. **intent**
    - **Purpose**: Manages intents for natural language processing.
    - **Key Fields**: 
      - `id`: Unique identifier for each intent.
      - `question`: The question associated with the intent.

13. **knowledge_base**
    - **Purpose**: Stores questions and answers for reference.
    - **Key Fields**: 
      - `id`: Unique identifier for each entry.
      - `question`: The question.
      - `answer`: The answer.

14. **knowledge_base_approval**
    - **Purpose**: Manages approval status of knowledge base entries.
    - **Key Fields**: 
      - `id`: Unique identifier for each approval entry.
      - `approved`: Approval status.

15. **langchain_pg_collection**
    - **Purpose**: Manages collections for Langchain embeddings.
    - **Key Fields**: 
      - `uuid`: Unique identifier for each collection.
      - `name`: Name of the collection.

16. **langchain_pg_embedding**
    - **Purpose**: Stores embeddings for documents.
    - **Key Fields**: 
      - `id`: Unique identifier for each embedding.
      - `collection_id`: Reference to the collection.

17. **message_store**
    - **Purpose**: Stores messages in a session.
    - **Key Fields**: 
      - `id`: Unique identifier for each message.
      - `session_id`: Reference to the session.

18. **order**
    - **Purpose**: Manages orders placed by clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each order.
      - `patients_id`: Reference to the client.

19. **packages**
    - **Purpose**: Stores package information for clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each package.
      - `medication`: Medication included in the package.

20. **pb_client_packages**
    - **Purpose**: Manages client-specific packages.
    - **Key Fields**: 
      - `id`: Unique identifier for each client package.
      - `patients_id`: Reference to the client.

21. **pb_invoices**
    - **Purpose**: Manages invoices for clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each invoice.
      - `patients_id`: Reference to the client.

22. **pb_packages**
    - **Purpose**: Stores information about packages.
    - **Key Fields**: 
      - `id`: Unique identifier for each package.
      - `name`: Name of the package.

23. **pb_sessions**
    - **Purpose**: Manages sessions for clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each session.
      - `patients_id`: Reference to the client.

24. **pb_tasks**
    - **Purpose**: Manages tasks associated with clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each task.
      - `patients_id`: Reference to the client.

25. **pharmacies**
    - **Purpose**: Stores pharmacy information.
    - **Key Fields**: 
      - `id`: Unique identifier for each pharmacy.
      - `name`: Name of the pharmacy.

26. **products**
    - **Purpose**: Manages product information.
    - **Key Fields**: 
      - `id`: Unique identifier for each product.
      - `name`: Name of the product.

27. **questionnaire**
    - **Purpose**: Stores questionnaires for clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each questionnaire.
      - `name`: Name of the questionnaire.

28. **questionnaire_question**
    - **Purpose**: Manages questions within a questionnaire.
    - **Key Fields**: 
      - `id`: Unique identifier for each question.
      - `questionnaire_id`: Reference to the questionnaire.

29. **services**
    - **Purpose**: Stores service information.
    - **Key Fields**: 
      - `id`: Unique identifier for each service.
      - `name`: Name of the service.

30. **session**
    - **Purpose**: Manages client sessions.
    - **Key Fields**: 
      - `id`: Unique identifier for each session.
      - `patients_id`: Reference to the client.

31. **session_chat_history**
    - **Purpose**: Stores chat history for sessions.
    - **Key Fields**: 
      - `id`: Unique identifier for each chat entry.
      - `session_id`: Reference to the session.

32. **sms_logs**
    - **Purpose**: Logs SMS communications.
    - **Key Fields**: 
      - `id`: Unique identifier for each SMS log.
      - `patients_id`: Reference to the client.

33. **subscription_plans**
    - **Purpose**: Manages subscription plans for clients.
    - **Key Fields**: 
      - `id`: Unique identifier for each plan.
      - `name`: Name of the subscription plan.

34. **tag**
    - **Purpose**: Stores tags for categorization.
    - **Key Fields**: 
      - `id`: Unique identifier for each tag.
      - `name`: Name of the tag.

35. **test**
    - **Purpose**: Placeholder for testing purposes.
    - **Key Fields**: 
      - `id`: Unique identifier for each test entry.

36. **test_session**
    - **Purpose**: Manages test sessions.
    - **Key Fields**: 
      - `id`: Unique identifier for each test session.
      - `user_id`: Reference to the user.

37. **user**
    - **Purpose**: Stores user information.
    - **Key Fields**: 
      - `id`: Unique identifier for each user.
      - `email`: User's email address.

38. **virtual_follow_ups**
    - **Purpose**: Manages virtual follow-up records.
    - **Key Fields**: 
      - `id`: Unique identifier for each follow-up.
      - `patients_id`: Reference to the client.

## Conclusion
This overview provides a high-level understanding of the tables in your database and their purposes. Each table is designed to handle specific data related to your application's functionality, ensuring a structured and organized approach to data management. If you need further details on any specific table or additional information, feel free to ask!