"""Minimal example script to parse BONES-SEED data and use with SOMA."""

import os

import numpy as np
import pandas as pd
import torch
from bvh import parse_bvh_motion
from soma import SOMALayer

# NOTE: Enter paths to your SOMA and BONES-SEED directories
BONES_SEED_BASE_PATH = "<path_to_seed_base_directory>"
SOMA_ASSETS_PATH = "<path_to_soma_base_directory>/assets"

device = "cuda"

# Load in metadata (shared by all data versions)
metadata_dir = os.path.join(BONES_SEED_BASE_PATH, "metadata")
metadata_files = sorted(
    f for f in os.listdir(metadata_dir) if f.startswith("seed_metadata") and f.endswith(".csv")
)
metadata_path = os.path.join(metadata_dir, metadata_files[-1])  # use latest version
metadata = pd.read_csv(metadata_path)
print(f"Number of motions: {len(metadata)}")  # 142220 motions

# SOMA model setup
soma = SOMALayer(
    data_root=SOMA_ASSETS_PATH,  # Path to downloaded assets (in the SOMA repo)
    identity_model_type="mhr",  # BONES-SEED data uses MHR identity params
    device=device,
)

# Choose a random example motion to load from the metadata
rand_motion_idx = np.random.randint(0, len(metadata))
motion_meta = metadata.iloc[rand_motion_idx]

#
# Loading uniform skeleton SOMA motion
#

uniform_motion_path = motion_meta["move_soma_uniform_path"]
uniform_motion_path = os.path.join(BONES_SEED_BASE_PATH, uniform_motion_path)
print(f"Loading motion: {motion_meta['move_name']} from {uniform_motion_path}")

# parse the BVH file (motions are at 120 fps)
local_rot_mats, root_trans = parse_bvh_motion(uniform_motion_path)
print(local_rot_mats.shape)  # [num_frames, 77, 3, 3]
print(root_trans.shape)  # [num_frames, 3]

# get corresponding SOMA shape parameters
# NOTE: all uniform skeleton motions use the same MHR body shape parameters
uniform_shape_params_path = motion_meta["move_soma_uniform_shape_path"]
uniform_shape_params_path = os.path.join(
    BONES_SEED_BASE_PATH, uniform_shape_params_path
)
uniform_shape_params = np.load(uniform_shape_params_path)
uniform_identity_params = torch.from_numpy(uniform_shape_params["identity_params"])
uniform_scale_params = torch.from_numpy(uniform_shape_params["scale_params"])

# put on same device and precision
uniform_identity_params = uniform_identity_params.to(device)
uniform_scale_params = uniform_scale_params.to(device)
local_rot_mats = local_rot_mats.to(uniform_identity_params)
root_trans = root_trans.to(uniform_identity_params)

# go through SOMA
soma_output = soma(
    local_rot_mats,
    uniform_identity_params,
    scale_params=uniform_scale_params,
    transl=root_trans,
    # rotations are already in matrix form
    pose2rot=False,
    # poses from BVH files are absolute, i.e., not wrt to SOMA canonical T-pose
    absolute_pose=True,
)
soma_vertices_out = soma_output["vertices"]
soma_joints_out = soma_output["joints"]

print(soma_joints_out.shape)  # [num_frames, 18056, 3]
print(soma_vertices_out.shape)  # [num_frames, 77, 3]

#
# Load corresponding proportioned SOMA motion
#

proportion_motion_path = motion_meta["move_soma_proportional_path"]
proportion_motion_path = os.path.join(BONES_SEED_BASE_PATH, proportion_motion_path)
print(f"Loading motion: {motion_meta['move_name']} from {proportion_motion_path}")

# parse the BVH file
local_rot_mats, root_trans = parse_bvh_motion(proportion_motion_path)

# get corresponding SOMA shape parameters
# NOTE: proportioned motions have different body shape parameters for each actor
proportion_shape_params_path = motion_meta["move_soma_proportional_shape_path"]
proportion_shape_params_path = os.path.join(
    BONES_SEED_BASE_PATH, proportion_shape_params_path
)
proportion_shape_params = np.load(proportion_shape_params_path)
proportion_identity_params = torch.from_numpy(
    proportion_shape_params["identity_params"]
)
proportion_scale_params = torch.from_numpy(proportion_shape_params["scale_params"])

# put on same device and precision
proportion_identity_params = proportion_identity_params.to(device)
proportion_scale_params = proportion_scale_params.to(device)
local_rot_mats = local_rot_mats.to(proportion_identity_params)
root_trans = root_trans.to(proportion_identity_params)

# go through SOMA
soma_output = soma(
    local_rot_mats,
    proportion_identity_params,
    scale_params=proportion_scale_params,
    transl=root_trans,
    # rotations are already in matrix form
    pose2rot=False,
    # poses from BVH files are absolute, i.e., not wrt to SOMA canonical T-pose
    absolute_pose=True,
)
soma_vertices_out = soma_output["vertices"]
soma_joints_out = soma_output["joints"]
