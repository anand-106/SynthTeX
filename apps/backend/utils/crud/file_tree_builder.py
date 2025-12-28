import os
from typing import List, Optional, Any, Dict
from uuid import UUID

from db.models import File


def build_file_tree(files: List[File], project_id: str) -> List[Dict[str, Any]]:
    
    
    tree_dict: Dict[str, Dict] = {}
    root_children: List[Dict] = []
    
    prefix_to_strip = None
    
    for file in files:
        storage_path = file.storage_path
        

        if prefix_to_strip is None:

            files_idx = storage_path.find("/files/")
            if files_idx != -1:
                prefix_to_strip = storage_path[:files_idx + 7]
            else:
                prefix_to_strip = ""
        
   
        relative_path = storage_path.replace(prefix_to_strip, "") if prefix_to_strip else storage_path
        
    
        parts = relative_path.split("/")
        

        current_level = root_children
        current_path = ""
        
        for i, part in enumerate(parts):
            current_path = f"{current_path}/{part}" if current_path else part
            is_last = (i == len(parts) - 1)
            
            if is_last:

                file_node = {
                    "id": str(file.id),
                    "name": part,
                    "isFolder": False,
                    "fileType": file.file_type.value if hasattr(file.file_type, 'value') else str(file.file_type)
                }
                current_level.append(file_node)
            else:
  
                folder_id = f"folder-{current_path.replace('/', '-')}"
                existing_folder = None
                
                for node in current_level:
                    if node.get("isFolder") and node.get("name") == part:
                        existing_folder = node
                        break
                
                if existing_folder is None:

                    existing_folder = {
                        "id": folder_id,
                        "name": part,
                        "isFolder": True,
                        "children": []
                    }
                    current_level.append(existing_folder)
                

                current_level = existing_folder["children"]
    

    def sort_tree(nodes: List[Dict]) -> List[Dict]:
        for node in nodes:
            if node.get("children"):
                node["children"] = sort_tree(node["children"])
        return sorted(nodes, key=lambda x: (not x.get("isFolder", False), x["name"].lower()))
    
    return sort_tree(root_children)
