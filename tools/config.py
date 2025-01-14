import csv
from typing import *
import os
import json
import importlib

from tools.case_modifiers import sluggify
from tools.dataset import load_dataset_metadata


def get_index_metadata(location_data):
    dataset = load_dataset_metadata(location_data['meta'])
    return {
        "name": dataset.name,
        "title": dataset.name.title(),
        "overview": dataset.overview,
        "version": dataset.version
    }


class Config:
    BUILDER_INDEX_FILE = 'website/_data/{format}.csv'
    DEFAULT_DESTINATION = 'website/datasets/{format}/{dataset}/'
    INDEX_FILENAME = "website/datasets/index.json"
    BUILDERS = ['python', 'visualizer', 'blockpy', 'teaser', 'json', 'csv']

    def __init__(self, destination: str, force_rebuild_index: bool = False, skip_list: List[str] = None):
        if skip_list is None:
            skip_list = []
        self.skip_list = skip_list
        self.destination = destination
        self.image_destination = "website/images/datasets/"
        self.teaser_destination = "website/_includes/teaser/{dataset}/"
        # TODO: Fix to be flexible path based on arg
        self.index_path = Config.INDEX_FILENAME
        if os.path.isfile(self.index_path) and not force_rebuild_index:
            self.index = self.load_index()
        else:
            self.index = self.create_index()

    def create_index(self) -> dict:
        # Scan the source directory and the builders
        sources = self.scan_sources()
        builders = self.scan_builders()
        index = {
            "_sources": sources,
            "_builders": builders
        }
        for builder in builders:
            index[builder] = {name: get_index_metadata(location_data)
                              for name, location_data in sources.items()
                              if name not in self.skip_list}
        return index

    def load_index(self) -> dict:
        with open(self.index_path, "r") as index_file:
            return json.load(index_file)

    def save_index(self):
        with open(self.index_path, "w") as index_file:
            json.dump(self.index, index_file, indent=4)

    def scan_sources(self):
        found = {}
        for potential_dataset in os.listdir('source'):
            potential_source_dir = os.path.join("source", potential_dataset)
            if os.path.isdir(potential_source_dir):
                meta_path = os.path.join(potential_source_dir, "{}-meta.csv".format(potential_dataset))
                data_path = os.path.join(potential_source_dir, "{}-corgis.csv".format(potential_dataset))
                if os.path.isfile(meta_path) and os.path.isfile(data_path):
                    found[potential_dataset] = {
                        "name": potential_dataset,
                        "directory": potential_source_dir,
                        "meta": meta_path,
                        "data": data_path
                    }
        return found

    def scan_builders(self):
        found = {}
        for builder in self.BUILDERS:
            imported = importlib.import_module("tools.build_formats.build_" + builder)
            found[builder] = imported.__version__
        return found

    def add_entry(self, builder_format, dataset):
        new_name = sluggify(dataset.name)
        builder_list_path = self.BUILDER_INDEX_FILE.format(format=builder_format)
        with open(builder_list_path, 'r+') as build_list_file:
            for line in build_list_file:
                if new_name == line.strip():
                    break
            else:
                # print("", file=build_list_file)
                print(new_name, file=build_list_file)
