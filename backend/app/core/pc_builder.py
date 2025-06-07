from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_groq import ChatGroq
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os
import pandas as pd
import glob
from typing import List, Dict, Any, Optional, Tuple
import logging
from dataclasses import dataclass
import pickle

# Configure logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Global instance for PCBuilderRAG singleton
_pc_builder: Optional['PCBuilderRAG'] = None


def get_pc_builder_instance() -> 'PCBuilderRAG':
    """
    Returns the singleton instance of PCBuilderRAG, initializing it if necessary.
    """
    global _pc_builder
    if _pc_builder is None:
        # You may want to adjust the config as needed
        config = PCBuilderConfig()
        # Optionally, set the API key from environment or .env
        import os
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("GROQ_API_KEY")
        if api_key:
            config.api_key = api_key
        _pc_builder = PCBuilderRAG(config)
    return _pc_builder


@dataclass
class PCBuilderConfig:
    csv_dir: str = "../csv"
    model_name: str = "llama-3.3-70b-versatile"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    embeddings_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    persist_directory: str = "../chroma_db"
    temperature: float = 0.2
    api_key: Optional[str] = None

# Component data processor


class ComponentDataProcessor:
    def __init__(self, config: PCBuilderConfig):
        self.config = config
        self.component_data = {}
        self.component_types = []

    def load_csv_data(self):
        """Load all CSV files from the specified directory"""
        csv_files = glob.glob(os.path.join(self.config.csv_dir, "*.csv"))

        for file_path in csv_files:
            component_type = os.path.basename(file_path).replace(".csv", "")
            self.component_types.append(component_type)

            try:
                df = pd.read_csv(file_path)
                self.component_data[component_type] = df
                print(f"Loaded {component_type} data with {len(df)} entries")
            except Exception as e:
                print(f"Error loading {component_type} data: {e}")

        return self.component_data

    def get_component_info(self, component_type: str, component_name: str) -> Dict:
        """Get detailed information about a specific component"""
        if component_type not in self.component_data:
            return {"error": f"Component type {component_type} not found"}

        df = self.component_data[component_type]
        component = df[df['name'] == component_name]

        if len(component) == 0:
            return {"error": f"Component {component_name} not found in {component_type}"}

        return component.iloc[0].to_dict()

    def filter_components(self, component_type: str, filters: Dict[str, Any]) -> pd.DataFrame:
        """Filter components based on specified criteria"""
        if component_type not in self.component_data:
            return pd.DataFrame()

        df = self.component_data[component_type]

        for column, value in filters.items():
            if column not in df.columns:
                continue

            if isinstance(value, dict):
                if 'min' in value and value['min'] is not None:
                    df = df[df[column] >= value['min']]
                if 'max' in value and value['max'] is not None:
                    df = df[df[column] <= value['max']]
            elif isinstance(value, list):
                df = df[df[column].isin(value)]
            else:
                df = df[df[column] == value]

        return df

    def get_all_component_types(self) -> List[str]:
        """Return all available component types"""
        return self.component_types

# PC Build class


class PCBuild:
    def __init__(self):
        self.components = {}
        self.total_price = 0

    def add_component(self, component_type: str, component_info: Dict):
        """Add a component to the build"""
        self.components[component_type] = component_info
        self.update_total_price()

    def remove_component(self, component_type: str):
        """Remove a component from the build"""
        if component_type in self.components:
            del self.components[component_type]
            self.update_total_price()

    def update_total_price(self):
        """Update the total price of the build"""
        self.total_price = sum(comp.get('price', 0)
                               for comp in self.components.values())

    def get_build_summary(self) -> Dict:
        """Get a summary of the current build"""
        return {
            "components": self.components,
            "total_price": self.total_price,
            "component_count": len(self.components)
        }

    def save_build(self, filename: str):
        """Save the current build to a file"""
        with open(filename, 'wb') as f:
            pickle.dump(self, f)

    @staticmethod
    def load_build(filename: str) -> 'PCBuild':
        """Load a build from a file"""
        with open(filename, 'rb') as f:
            return pickle.load(f)

# Compatibility checker


class CompatibilityChecker:
    def __init__(self, component_data: Dict[str, pd.DataFrame]):
        self.component_data = component_data

    def check_cpu_motherboard_compatibility(self, cpu_info: Dict, motherboard_info: Dict) -> Tuple[bool, str]:
        """Check if CPU and motherboard are compatible"""
        if not cpu_info or not motherboard_info:
            return True, "Missing component information"

        # Check socket compatibility
        if 'socket' in motherboard_info and 'socket' in cpu_info:
            if motherboard_info['socket'] != cpu_info['socket']:
                return False, f"Socket mismatch: CPU socket {cpu_info['socket']} is not compatible with motherboard socket {motherboard_info['socket']}"

        return True, "CPU and motherboard are compatible"

    def check_memory_motherboard_compatibility(self, memory_info: Dict, motherboard_info: Dict) -> Tuple[bool, str]:
        """Check if memory and motherboard are compatible"""
        if not memory_info or not motherboard_info:
            return True, "Missing component information"

        # Check memory type compatibility
        if 'memory_type' in motherboard_info and 'type' in memory_info:
            if motherboard_info['memory_type'] != memory_info['type']:
                return False, f"Memory type mismatch: RAM type {memory_info['type']} is not compatible with motherboard memory type {motherboard_info['memory_type']}"

        return True, "Memory and motherboard are compatible"

    def check_build_compatibility(self, build: PCBuild) -> List[Dict]:
        """Check compatibility of all components in a build"""
        compatibility_issues = []

        # CPU and motherboard compatibility
        if 'cpu' in build.components and 'motherboard' in build.components:
            is_compatible, message = self.check_cpu_motherboard_compatibility(
                build.components['cpu'], build.components['motherboard']
            )
            if not is_compatible:
                compatibility_issues.append({
                    "components": ["cpu", "motherboard"],
                    "issue": message
                })

        # Memory and motherboard compatibility
        if 'memory' in build.components and 'motherboard' in build.components:
            is_compatible, message = self.check_memory_motherboard_compatibility(
                build.components['memory'], build.components['motherboard']
            )
            if not is_compatible:
                compatibility_issues.append({
                    "components": ["memory", "motherboard"],
                    "issue": message
                })

        return compatibility_issues

# Budget optimizer


class BudgetOptimizer:
    def __init__(self, component_data: Dict[str, pd.DataFrame]):
        self.component_data = component_data

    def optimize_build(self, budget: float, preferences: Dict[str, Any]) -> PCBuild:
        """Optimize a PC build based on budget and preferences"""
        build = PCBuild()
        remaining_budget = budget

        # Prioritize components based on preferences
        priority_components = [
            "cpu", "motherboard", "memory", "video-card", "power-supply",
            "case", "internal-hard-drive", "cpu-cooler"
        ]

        # Adjust priorities based on user preferences
        if 'priority' in preferences:
            for component, priority in preferences['priority'].items():
                if component in priority_components:
                    # Move higher priority components to the front
                    priority_components.remove(component)
                    priority_components.insert(0, component)

        # Allocate budget percentages
        budget_allocation = {
            "cpu": 0.25,
            "video-card": 0.3,
            "motherboard": 0.15,
            "memory": 0.1,
            "internal-hard-drive": 0.1,
            "power-supply": 0.05,
            "case": 0.03,
            "cpu-cooler": 0.02
        }

        # Adjust allocations based on preferences
        if 'usage' in preferences:
            usage = preferences['usage'].lower()
            if 'gaming' in usage:
                budget_allocation["video-card"] = 0.35
                budget_allocation["cpu"] = 0.2
            elif 'workstation' in usage or 'productivity' in usage:
                budget_allocation["cpu"] = 0.3
                budget_allocation["memory"] = 0.15
                budget_allocation["video-card"] = 0.2

        # Select components based on budget allocation
        for component_type in priority_components:
            if component_type not in self.component_data:
                continue

            # Calculate component budget
            component_budget = budget * \
                budget_allocation.get(component_type, 0.1)

            # Get components within budget
            df = self.component_data[component_type]
            if 'price' in df.columns:
                affordable_components = df[df['price'] <= component_budget].sort_values(
                    'price', ascending=False)

                if not affordable_components.empty:
                    # Select the best component within budget
                    selected_component = affordable_components.iloc[0].to_dict(
                    )
                    build.add_component(component_type, selected_component)
                    remaining_budget -= selected_component.get('price', 0)

        return build

# PC Builder RAG System - adapted for API use


class PCBuilderRAG:
    def __init__(self, config: PCBuilderConfig):
        self.config = config
        self.processor = ComponentDataProcessor(config)
        self.component_data = self.processor.load_csv_data()
        self.compatibility_checker = CompatibilityChecker(self.component_data)
        self.budget_optimizer = BudgetOptimizer(self.component_data)
        self.current_build = PCBuild()
        self.memories: Dict[str, ConversationBufferMemory] = {}
        self.setup_rag_system()

    def setup_rag_system(self):
        """Set up the RAG system with embeddings and vector store"""
        # Prepare text data from component CSVs
        texts = []
        metadatas = []

        for component_type, df in self.component_data.items():
            for _, row in df.iterrows():
                # Convert row to string representation
                text = f"Component Type: {component_type}\n"
                metadata = {"component_type": component_type}

                for col, value in row.items():
                    text += f"{col}: {value}\n"
                    metadata[col] = value

                texts.append(text)
                metadatas.append(metadata)

        # Initialize embeddings first
        self.embeddings = HuggingFaceEmbeddings(
            model_name=self.config.embeddings_model)

        # Create or load vector store
        if os.path.exists(self.config.persist_directory) and os.listdir(self.config.persist_directory):
            print(
                f"Loading existing ChromaDB from {self.config.persist_directory}")
            self.vectorstore = Chroma(
                persist_directory=self.config.persist_directory,
                embedding_function=self.embeddings
            )
        else:
            print(f"Creating new ChromaDB in {self.config.persist_directory}")
            # Prepare text data from component CSVs
            texts = []
            metadatas = []
            for component_type, df in self.component_data.items():
                for _, row in df.iterrows():
                    text = f"Component Type: {component_type}\n"
                    metadata = {"component_type": component_type}
                    for col, value in row.items():
                        text += f"{col}: {value}\n"
                        # Ensure metadata values are strings
                        metadata[col] = str(value)
                    texts.append(text)
                    metadatas.append(metadata)

            self.vectorstore = Chroma.from_texts(
                texts=texts,
                embedding=self.embeddings,
                metadatas=metadatas,
                persist_directory=self.config.persist_directory
            )
            self.vectorstore.persist()
            print(
                f"ChromaDB created and persisted to {self.config.persist_directory}")

        # Create custom prompt template
        template = """You are a knowledgeable PC building assistant. Use the following context to answer the user's question about PC components, builds, and recommendations.

Context: {context}

Chat History: {chat_history}

User Question: {question}

Provide detailed, accurate information about PC components. If recommending components, explain your reasoning.
If asked about compatibility, provide specific details about what makes components compatible or incompatible.
If asked about budget builds, suggest components that offer good value while meeting the user's requirements.

Answer:
"""

        QA_PROMPT = PromptTemplate(
            template=template,
            input_variables=["context", "chat_history", "question"]
        )

        # Initialize LLM
        if self.config.api_key:
            os.environ["GROQ_API_KEY"] = self.config.api_key

        self.llm = ChatGroq(model_name=self.config.model_name,
                            temperature=self.config.temperature)

        # Create retrieval chain
        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.vectorstore.as_retriever(),
            combine_docs_chain_kwargs={"prompt": QA_PROMPT}
        )

    def get_answer(self, question: str, session_id: str) -> str:
        """Get an answer from the RAG system using session-specific memory"""
        if session_id not in self.memories:
            self.memories[session_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True  # Ensure this is True if your chain expects message objects
            )
        session_memory = self.memories[session_id]

        result = self.qa_chain.invoke({
            "question": question,
            "chat_history": session_memory.chat_memory.messages
        })

        session_memory.save_context(
            {"input": question}, {"output": result["answer"]})
        return result["answer"]
