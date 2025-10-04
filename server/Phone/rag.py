import logging
from config import index
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

def retrieve_mental_health_resources(query: str) -> str:
    """
    Retrieve relevant mental health resources from Pinecone using RAG.
    Queries across multiple namespaces (one per PDF).
    """
    try:
        # Load the same embedding model used for upload
        model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')

        # Embed the query
        query_embedding = model.encode(query).tolist()

        # Define namespaces for medical resources
        namespaces = ["medical_resources","medical_resources1"]

        # Query each namespace and collect results
        all_results = []
        for ns in namespaces:
            try:
                response = index.query(
                    vector=query_embedding,
                    top_k=3,  # Fewer per namespace to get diversity
                    include_metadata=True,
                    namespace=ns
                )
                # Add namespace info to results
                for match in response['matches']:
                    match['source_namespace'] = ns
                    all_results.append(match)
            except Exception as ns_error:
                logger.warning(f"Error querying namespace {ns}: {ns_error}")
                continue

        # Sort all results by score and take top 5
        all_results.sort(key=lambda x: x['score'], reverse=True)
        top_results = all_results[:5]

        # Format the results
        resources = []
        for match in top_results:
            metadata = match['metadata']
            source = match.get('source_namespace', 'Unknown')
            resources.append(f"Source: {source}\nContent: {metadata.get('text', 'N/A')}\nPage: {metadata.get('page', 'N/A')}\nRelevance: {match['score']:.3f}")

        return "\n\n".join(resources) if resources else "No relevant resources found."
    except Exception as e:
        logger.error(f"Error retrieving from Pinecone: {e}")
        return "Error retrieving resources."
