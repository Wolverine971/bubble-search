Ok I have a react project with an express server attached with supabase. And I am building a better version of perplexity.

In this version the frontend display will be tightly integrated with the searching functionality. The searching functionality will be done with langgraph and tavilly and it will go through a series of steps extracting certain pieces of information from the search query and returning information as it builds up the the final output of answering or addressing the user's search query.

So the first thing I need to do is use langgraph.js to run a series of search functionalities. Look here to understand langgraph.js https://langchain-ai.github.io/langgraphjs/

We will run our searches in through tavily (look here for tavily docs https://docs.tavily.com/documentation/api-reference/endpoint/search).

Before we plan our search I want you to classify the search query
