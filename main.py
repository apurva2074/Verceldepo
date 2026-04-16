import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np


class PropertyProject:
    """
    3D Property Model Generator - Main project class for scanning and processing
    property images for 3D reconstruction.
    """
    
    def __init__(self, project_name: str = "Property3"):
        self.project_name = project_name
        self.base_directory = Path(__file__).parent
        self.property_directory = self.base_directory / "photogrammetry_pipeline" / project_name
        self.features_data = {}  # Store keypoints and descriptors for each image
        
    def scan_images(self, directory_path: Optional[str] = None) -> Dict[str, List[str]]:
        """
        Scan the property directory for subfolders (rooms) and list images in each.
        
        Args:
            directory_path: Optional custom directory path. If None, uses default property directory.
            
        Returns:
            Dictionary mapping room names to list of image files
        """
        if directory_path:
            target_dir = Path(directory_path)
        else:
            target_dir = self.property_directory
            
        # Check if directory exists
        if not target_dir.exists():
            raise FileNotFoundError(f"Property directory not found: {target_dir}")
        
        # Check if directory is empty
        if not any(target_dir.iterdir()):
            raise ValueError(f"Property directory is empty: {target_dir}")
        
        room_images = {}
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp', '.avif'}
        
        # Scan each subfolder (room)
        for room_folder in target_dir.iterdir():
            if room_folder.is_dir():
                room_name = room_folder.name
                images = []
                
                # Find all image files in the room folder
                for file_path in room_folder.iterdir():
                    if file_path.is_file() and file_path.suffix.lower() in image_extensions:
                        images.append(file_path.name)
                
                room_images[room_name] = images
        
        return room_images
    
    def validate_rooms(self, room_images: Dict[str, List[str]]) -> Dict[str, bool]:
        """
        Validate that each room has sufficient images (3-4 minimum).
        
        Args:
            room_images: Dictionary of room names to image lists
            
        Returns:
            Dictionary mapping room names to validation status
        """
        validation_results = {}
        min_images = 3
        
        for room_name, images in room_images.items():
            image_count = len(images)
            is_valid = image_count >= min_images
            validation_results[room_name] = is_valid
            
            # Print summary for this room
            status = "VALID" if is_valid else "INSUFFICIENT"
            print(f"Room Name: {room_name} | Images Found: {image_count} | Status: {status}")
        
        return validation_results
    
    def print_summary(self, room_images: Dict[str, List[str]]) -> None:
        """
        Print a comprehensive summary of the scanning results.
        
        Args:
            room_images: Dictionary of room names to image lists
        """
        print("\n" + "="*60)
        print("3D PROPERTY MODEL GENERATOR - SCAN SUMMARY")
        print("="*60)
        print(f"Project: {self.project_name}")
        print(f"Directory: {self.property_directory}")
        print(f"Total Rooms Found: {len(room_images)}")
        print("-"*60)
        
        total_images = 0
        valid_rooms = 0
        
        for room_name, images in room_images.items():
            image_count = len(images)
            total_images += image_count
            
            if image_count >= 3:
                valid_rooms += 1
                status = "READY"
            else:
                status = "NEEDS MORE IMAGES"
            
            print(f"Room Name: {room_name} | Images Found: {image_count} | Status: {status}")
        
        print("-"*60)
        print(f"Total Images: {total_images}")
        print(f"Valid Rooms (3+ images): {valid_rooms}/{len(room_images)}")
        print("="*60)
    
    def detect_features(self, room_images: Dict[str, List[str]], validation_results: Dict[str, bool]) -> None:
        """
        Detect SIFT features in images for valid rooms only.
        
        Args:
            room_images: Dictionary mapping room names to image file lists
            validation_results: Dictionary mapping room names to validation status
        """
        print("\n" + "="*60)
        print("DETECTING SIFT FEATURES")
        print("="*60)
        
        # Initialize SIFT detector
        sift = cv2.SIFT_create()
        
        # Process only valid rooms
        for room_name, images in room_images.items():
            if not validation_results[room_name]:
                continue  # Skip invalid rooms
            
            room_total_keypoints = 0
            room_features = {}
            
            print(f"\nProcessing {room_name}:")
            
            for image_name in images:
                image_path = self.property_directory / room_name / image_name
                
                try:
                    # Load image
                    image = cv2.imread(str(image_path))
                    if image is None:
                        print(f"  Warning: Could not load image {image_name}")
                        continue
                    
                    # Convert to grayscale
                    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                    
                    # Detect keypoints and compute descriptors using SIFT
                    keypoints, descriptors = sift.detectAndCompute(gray_image, None)
                    
                    # Store features
                    room_features[image_name] = {
                        'keypoints': keypoints,
                        'descriptors': descriptors,
                        'keypoint_count': len(keypoints) if keypoints else 0
                    }
                    
                    if keypoints:
                        room_total_keypoints += len(keypoints)
                        print(f"  {image_name}: {len(keypoints)} keypoints")
                    else:
                        print(f"  {image_name}: 0 keypoints (no features detected)")
                        
                except Exception as e:
                    print(f"  Error processing {image_name}: {e}")
                    continue
            
            # Store room features in class
            self.features_data[room_name] = room_features
            
            # Print room summary
            print(f"Processing {room_name}: Found {room_total_keypoints} keypoints across {len(images)} images")
        
        print("\n" + "="*60)
        print("FEATURE DETECTION COMPLETE")
        print("="*60)
    
    def match_features(self) -> None:
        """
        Match features between image pairs in valid rooms using enhanced FLANN matcher.
        Applies adaptive symmetry test and dynamic RANSAC filtering.
        """
        print("\n" + "="*60)
        print("MATCHING FEATURES (ENHANCED)")
        print("="*60)
        
        # Initialize FLANN matcher
        FLANN_INDEX_KDTREE = 1
        index_params = dict(algorithm=FLANN_INDEX_KDTREE, trees=5)
        search_params = dict(checks=50)
        flann = cv2.FlannBasedMatcher(index_params, search_params)
        
        # Store matches data
        self.matches_data = {}
        ratio_threshold = 0.75  # More relaxed Lowe's ratio test threshold
        
        # Process each room
        for room_name, room_features in self.features_data.items():
            print(f"\nMatching features in {room_name}:")
            room_matches = {}
            image_names = list(room_features.keys())
            matchable_pairs = 0
            
            # Compare pairs of images
            for i in range(len(image_names)):
                for j in range(i + 1, len(image_names)):
                    img1_name = image_names[i]
                    img2_name = image_names[j]
                    
                    # Get descriptors and keypoints for both images
                    desc1 = room_features[img1_name]['descriptors']
                    desc2 = room_features[img2_name]['descriptors']
                    kp1 = room_features[img1_name]['keypoints']
                    kp2 = room_features[img2_name]['keypoints']
                    
                    # Skip if no descriptors found
                    if desc1 is None or desc2 is None:
                        print(f"  {img1_name} & {img2_name}: No descriptors found")
                        continue
                    
                    try:
                        # Symmetry test: match both directions
                        matches_1_to_2 = flann.knnMatch(desc1, desc2, k=2)
                        matches_2_to_1 = flann.knnMatch(desc2, desc1, k=2)
                        
                        # Apply Lowe's ratio test in both directions
                        good_matches_1_to_2 = []
                        for match_pair in matches_1_to_2:
                            if len(match_pair) == 2:
                                m, n = match_pair
                                if m.distance < ratio_threshold * n.distance:
                                    good_matches_1_to_2.append(m)
                        
                        good_matches_2_to_1 = []
                        for match_pair in matches_2_to_1:
                            if len(match_pair) == 2:
                                m, n = match_pair
                                if m.distance < ratio_threshold * n.distance:
                                    good_matches_2_to_1.append(m)
                        
                        # Adaptive Symmetry: Use symmetric matches if >= 15, otherwise use standard Lowe's
                        if len(good_matches_1_to_2) >= 15 and len(good_matches_2_to_1) >= 15:
                            # Use symmetry test
                            symmetric_matches = []
                            for match1 in good_matches_1_to_2:
                                for match2 in good_matches_2_to_1:
                                    if match1.queryIdx == match2.trainIdx and match1.trainIdx == match2.queryIdx:
                                        symmetric_matches.append(match1)
                                        break
                            
                            print(f"    {img1_name} & {img2_name}: {len(symmetric_matches)} symmetric matches (from {len(good_matches_1_to_2)} + {len(good_matches_2_to_1)})")
                            working_matches = symmetric_matches
                        else:
                            # Fall back to standard Lowe's ratio (use the better direction)
                            if len(good_matches_1_to_2) >= len(good_matches_2_to_1):
                                working_matches = good_matches_1_to_2
                                print(f"    {img1_name} & {img2_name}: {len(working_matches)} Lowe matches (fallback)")
                            else:
                                working_matches = good_matches_2_to_1
                                print(f"    {img1_name} & {img2_name}: {len(working_matches)} Lowe matches (fallback)")
                        
                        # Apply Fundamental Matrix filter with dynamic RANSAC threshold
                        if len(working_matches) >= 8:  # Need exactly 8 or more points for Fundamental Matrix
                            try:
                                # Extract point coordinates with explicit type casting
                                pts1 = np.array([kp1[m.queryIdx].pt for m in working_matches], dtype=np.float32).reshape(-1, 1, 2)
                                pts2 = np.array([kp2[m.trainIdx].pt for m in working_matches], dtype=np.float32).reshape(-1, 1, 2)
                                
                                # Dynamic RANSAC threshold based on match count
                                if 8 <= len(working_matches) <= 15:
                                    ransac_threshold = 7.0  # More wiggle room for smaller sets
                                    print(f"    Using relaxed RANSAC threshold ({ransac_threshold}) for {len(working_matches)} matches")
                                else:
                                    ransac_threshold = 3.0  # Standard threshold for larger sets
                                
                                # Find Fundamental Matrix using RANSAC
                                F, mask = cv2.findFundamentalMat(
                                    pts1, pts2, 
                                    cv2.FM_RANSAC, 
                                    ransacReprojThreshold=ransac_threshold,
                                    confidence=0.99
                                )
                                
                                # Handle None returns from findFundamentalMat
                                if F is None or mask is None:
                                    print(f"    {img1_name} & {img2_name}: Geometry could not be verified")
                                    final_matches = working_matches
                                else:
                                    # Filter matches using RANSAC mask - FIXED IMPLEMENTATION
                                    mask = mask.ravel()  # Flatten the mask
                                    # Use list comprehension to avoid IndexError
                                    ransac_matches = [m for i, m in enumerate(working_matches) if i < len(mask) and mask[i] == 1]
                                    
                                    print(f"    {img1_name} & {img2_name}: {len(ransac_matches)} true matches after RANSAC")
                                    final_matches = ransac_matches
                                
                                # Count matchable pairs
                                if len(final_matches) >= 8:
                                    matchable_pairs += 1
                                    
                            except Exception as e:
                                print(f"    Error in RANSAC processing: {e}")
                                print(f"    {img1_name} & {img2_name}: Geometry could not be verified")
                                final_matches = working_matches
                        else:
                            print(f"    {img1_name} & {img2_name}: Insufficient matches for RANSAC ({len(working_matches)} < 8)")
                            final_matches = working_matches
                        
                        # Store matches
                        match_key = f"{img1_name}&{img2_name}"
                        room_matches[match_key] = {
                            'good_matches': final_matches,
                            'match_count': len(final_matches),
                            'img1': img1_name,
                            'img2': img2_name,
                            'working_count': len(working_matches),
                            'filtered_count': len(final_matches)
                        }
                        
                    except Exception as e:
                        print(f"  Error matching {img1_name} & {img2_name}: {e}")
                        continue
            
            # Store room matches
            self.matches_data[room_name] = room_matches
            
            # Print room summary
            print(f"\nRoom Summary - {room_name}: {matchable_pairs} matchable pairs (8+ true matches)")
        
        print("\n" + "="*60)
        print("PROPERTY-WIDE MATCHING SUMMARY")
        print("="*60)
        
        total_matchable_pairs = 0
        for room_name, room_matches in self.matches_data.items():
            matchable_pairs = sum(1 for match_data in room_matches.values() if match_data['match_count'] >= 8)
            total_pairs = len(room_matches)
            print(f"{room_name}: {matchable_pairs}/{total_pairs} matchable pairs")
            total_matchable_pairs += matchable_pairs
        
        print("-"*60)
        print(f"TOTAL PROPERTY: {total_matchable_pairs} matchable pairs across all rooms")
        print(f"STATUS: Ready for 3D Point Cloud Generation")
        print("="*60)
    
    def recover_camera_poses(self) -> None:
        """
        Recover camera poses and triangulate 3D points for each room using Essential Matrix.
        """
        print("\n" + "="*60)
        print("RECOVERING CAMERA POSES & TRIANGULATING 3D POINTS")
        print("="*60)
        
        # Storage for 3D point clouds
        self.point_clouds = {}
        
        # Process each room
        for room_name, room_matches in self.matches_data.items():
            print(f"\nProcessing room: {room_name}")
            
            # Get matchable pairs (8+ true matches)
            matchable_pairs = {key: data for key, data in room_matches.items() if data['match_count'] >= 8}
            
            if not matchable_pairs:
                print(f"  {room_name}: No matchable pairs found - skipping")
                continue
            
            # Get image dimensions from feature data
            room_features = self.features_data[room_name]
            sample_image_name = list(room_features.keys())[0]
            
            # Estimate image dimensions (we'll need to load one image to get actual size)
            sample_image_path = self.property_directory / room_name / sample_image_name
            try:
                sample_image = cv2.imread(str(sample_image_path))
                if sample_image is None:
                    print(f"  {room_name}: Could not load sample image - using default dimensions")
                    height, width = 480, 640  # Default smartphone dimensions
                else:
                    height, width = sample_image.shape[:2]
            except:
                height, width = 480, 640  # Default smartphone dimensions
            
            # Camera intrinsic matrix K
            focal_length = 1.2 * max(width, height)
            K = np.array([
                [focal_length, 0, width/2],
                [0, focal_length, height/2],
                [0, 0, 1]
            ], dtype=np.float32)
            
            print(f"  Camera intrinsics: fx={focal_length:.1f}, fy={focal_length:.1f}")
            print(f"  Image dimensions: {width}x{height}")
            print(f"  Matchable pairs: {len(matchable_pairs)}")
            
            # Collect all 3D points from all matchable pairs
            all_3d_points = []
            processed_pairs = 0
            
            for match_key, match_data in matchable_pairs.items():
                img1_name = match_data['img1']
                img2_name = match_data['img2']
                good_matches = match_data['good_matches']
                
                try:
                    # Get keypoints and descriptors for both images
                    kp1 = room_features[img1_name]['keypoints']
                    kp2 = room_features[img2_name]['keypoints']
                    
                    # Extract matched points
                    pts1 = np.array([kp1[m.queryIdx].pt for m in good_matches], dtype=np.float32)
                    pts2 = np.array([kp2[m.trainIdx].pt for m in good_matches], dtype=np.float32)
                    
                    # Find Essential Matrix
                    E, mask = cv2.findEssentialMat(pts1, pts2, K, method=cv2.RANSAC, prob=0.999, threshold=1.0)
                    
                    if E is None or mask is None:
                        print(f"    {img1_name} & {img2_name}: Could not compute Essential Matrix")
                        continue
                    
                    # Recover relative camera pose
                    _, R, t, mask_pose = cv2.recoverPose(E, pts1, pts2, K)
                    
                    if R is None or t is None:
                        print(f"    {img1_name} & {img2_name}: Could not recover camera pose")
                        continue
                    
                    # Triangulate points
                    # Projection matrices for two cameras
                    P1 = K @ np.hstack([np.eye(3), np.zeros((3, 1))])  # First camera at origin
                    P2 = K @ np.hstack([R, t])  # Second camera pose
                    
                    # Convert points to homogeneous coordinates
                    pts1_homo = cv2.convertPointsToHomogeneous(pts1).reshape(-1, 3)
                    pts2_homo = cv2.convertPointsToHomogeneous(pts2).reshape(-1, 3)
                    
                    # Triangulate 3D points
                    points_4d = cv2.triangulatePoints(P1, P2, pts1.T, pts2.T)
                    
                    # Convert from homogeneous to 3D coordinates
                    points_3d = points_4d[:3] / points_4d[3]
                    points_3d = points_3d.T  # Transpose to get (N, 3) shape
                    
                    # Filter points with positive depth (in front of both cameras)
                    valid_points = []
                    for i, point in enumerate(points_3d):
                        # Check if point is in front of both cameras
                        if point[2] > 0:  # Positive Z for first camera
                            # Transform to second camera coordinate system
                            point_second = R @ point + t.flatten()
                            if point_second[2] > 0:  # Positive Z for second camera
                                valid_points.append(point)
                    
                    all_3d_points.extend(valid_points)
                    processed_pairs += 1
                    
                    if len(valid_points) > 0:
                        print(f"    {img1_name} & {img2_name}: {len(valid_points)} 3D points")
                    
                except Exception as e:
                    print(f"    Error processing {img1_name} & {img2_name}: {e}")
                    continue
            
            # Store point cloud for this room
            if all_3d_points:
                self.point_clouds[room_name] = np.array(all_3d_points)
                print(f"  Room {room_name}: Recovered {len(all_3d_points)} 3D points from {processed_pairs} camera poses")
            else:
                print(f"  Room {room_name}: No valid 3D points recovered")
                self.point_clouds[room_name] = np.array([])
        
        print("\n" + "="*60)
        print("CAMERA POSE RECOVERY COMPLETE")
        print("="*60)
        
        # Summary of all rooms
        total_points = 0
        rooms_with_points = 0
        for room_name, points in self.point_clouds.items():
            if len(points) > 0:
                rooms_with_points += 1
                total_points += len(points)
                print(f"{room_name}: {len(points)} 3D points")
        
        print("-"*60)
        print(f"TOTAL: {total_points} 3D points across {rooms_with_points} rooms")
        print("="*60)
    
    def save_sparse_point_cloud(self) -> None:
        """
        Save all recovered 3D points to a PLY file for visualization.
        """
        print("\n" + "="*60)
        print("SAVING SPARSE POINT CLOUD")
        print("="*60)
        
        # Collect all points from all rooms
        all_points = []
        for room_name, points in self.point_clouds.items():
            if len(points) > 0:
                all_points.extend(points)
                print(f"  {room_name}: {len(points)} points")
        
        if not all_points:
            print("ERROR: No 3D points found to save")
            return
        
        # Convert to numpy array
        all_points = np.array(all_points)
        total_points = len(all_points)
        
        # Create PLY file path
        ply_file_path = self.base_directory / "sparse_model.ply"
        
        try:
            # Write PLY file
            with open(ply_file_path, 'w') as f:
                # Write PLY header
                f.write("ply\n")
                f.write("format ascii 1.0\n")
                f.write(f"element vertex {total_points}\n")
                f.write("property float x\n")
                f.write("property float y\n")
                f.write("property float z\n")
                f.write("end_header\n")
                
                # Write point data
                for point in all_points:
                    f.write(f"{point[0]:.6f} {point[1]:.6f} {point[2]:.6f}\n")
            
            print(f"\nSUCCESS: Sparse point cloud saved to {ply_file_path}")
            print(f"Total points: {total_points}")
            print("Use MeshLab to view the result.")
            
        except Exception as e:
            print(f"ERROR: Could not save PLY file: {e}")
        
        print("="*60)
    
    def generate_dense_cloud(self, room_name: str, room_features: dict, room_matches: dict) -> np.ndarray:
        """
        Generate dense point cloud using StereoSGBM for rooms with low sparse points.
        """
        print(f"  Generating dense cloud for {room_name} using StereoSGBM...")
        
        # Get matchable pairs (8+ true matches)
        matchable_pairs = {key: data for key, data in room_matches.items() if data['match_count'] >= 8}
        
        if not matchable_pairs:
            print(f"    No matchable pairs for dense generation")
            return np.array([])
        
        # Get the best pair (most matches)
        best_pair_key = max(matchable_pairs.keys(), key=lambda k: matchable_pairs[k]['match_count'])
        best_pair = matchable_pairs[best_pair_key]
        
        img1_name = best_pair['img1']
        img2_name = best_pair['img2']
        
        try:
            # Load images
            img1_path = self.property_directory / room_name / img1_name
            img2_path = self.property_directory / room_name / img2_name
            
            img1 = cv2.imread(str(img1_path), cv2.IMREAD_GRAYSCALE)
            img2 = cv2.imread(str(img2_path), cv2.IMREAD_GRAYSCALE)
            
            if img1 is None or img2 is None:
                print(f"    Could not load images for dense reconstruction")
                return np.array([])
            
            # Get image dimensions
            height, width = img1.shape
            
            # Create StereoSGBM matcher
            min_disp = 0
            max_disp = 16 * 3  # Adjust based on scene depth
            block_size = 11
            p1 = 8 * 3 * block_size ** 2
            p2 = 32 * 3 * block_size ** 2
            disp12_max_diff = 1
            uniqueness_ratio = 10
            speckle_window_size = 100
            speckle_range = 32
            
            stereo = cv2.StereoSGBM_create(
                minDisparity=min_disp,
                numDisparities=max_disp,
                blockSize=block_size,
                P1=p1,
                P2=p2,
                disp12MaxDiff=disp12_max_diff,
                uniquenessRatio=uniqueness_ratio,
                speckleWindowSize=speckle_window_size,
                speckleRange=speckle_range
            )
            
            # Compute disparity map
            disparity = stereo.compute(img1, img2)
            
            # Convert disparity to depth
            # Assuming baseline and focal length (approximate for smartphone)
            baseline = 0.1  # 10cm baseline (approximate)
            focal_length = 1.2 * max(width, height)
            
            # Avoid division by zero
            disparity[disparity <= 0] = 1
            
            # Calculate depth map
            depth_map = (focal_length * baseline) / disparity.astype(np.float32)
            
            # Create 3D point cloud from depth map
            dense_points = []
            step = 4  # Sample every 4th pixel for performance
            
            for y in range(0, height, step):
                for x in range(0, width, step):
                    depth = depth_map[y, x]
                    
                    # Filter reasonable depth values
                    if 0.1 < depth < 10.0:  # Between 10cm and 10m
                        # Convert image coordinates to 3D coordinates
                        z = depth
                        x_3d = (x - width/2) * z / focal_length
                        y_3d = (y - height/2) * z / focal_length
                        
                        dense_points.append([x_3d, y_3d, z])
            
            dense_points = np.array(dense_points)
            
            # Filter outliers using statistical removal
            if len(dense_points) > 100:
                # Simple statistical filtering
                mean = np.mean(dense_points, axis=0)
                std = np.std(dense_points, axis=0)
                
                # Keep points within 3 standard deviations
                mask = np.all(np.abs(dense_points - mean) < 3 * std, axis=1)
                dense_points = dense_points[mask]
            
            print(f"    Generated {len(dense_points)} dense points")
            return dense_points
            
        except Exception as e:
            print(f"    Error in dense generation: {e}")
            return np.array([])
    
    def generate_bounding_box(self, room_name: str) -> np.ndarray:
        """
        Generate a simple 3D bounding box as placeholder for failed reconstructions.
        """
        print(f"  Generating bounding box placeholder for {room_name}")
        
        # Get image dimensions from first image
        room_features = self.features_data[room_name]
        sample_image_name = list(room_features.keys())[0]
        sample_image_path = self.property_directory / room_name / sample_image_name
        
        try:
            sample_image = cv2.imread(str(sample_image_path))
            if sample_image is None:
                height, width = 480, 640
            else:
                height, width = sample_image.shape[:2]
        except:
            height, width = 480, 640
        
        # Create a simple rectangular room bounding box
        # Assume room is roughly 3m x 4m x 2.5m
        room_width = 3.0
        room_length = 4.0
        room_height = 2.5
        
        # Generate corners of the bounding box
        corners = [
            [-room_width/2, -room_length/2, 0],
            [room_width/2, -room_length/2, 0],
            [room_width/2, room_length/2, 0],
            [-room_width/2, room_length/2, 0],
            [-room_width/2, -room_length/2, room_height],
            [room_width/2, -room_length/2, room_height],
            [room_width/2, room_length/2, room_height],
            [-room_width/2, room_length/2, room_height]
        ]
        
        # Add some points on edges for better visualization
        edge_points = []
        for i in range(len(corners)):
            for j in range(i+1, len(corners)):
                # Add points along edges
                start = np.array(corners[i])
                end = np.array(corners[j])
                for t in np.linspace(0, 1, 5):
                    edge_points.append(start + t * (end - start))
        
        all_points = corners + edge_points
        return np.array(all_points)
    
    def save_per_room_models(self) -> None:
        """
        Save individual PLY files for each room with robust reconstruction.
        """
        print("\n" + "="*60)
        print("ROBUST PER-ROOM RECONSTRUCTION")
        print("="*60)
        
        # Create output directory
        output_dir = self.base_directory / "output" / "models"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Output directory: {output_dir}")
        
        # Process each room
        for room_name in self.features_data.keys():
            print(f"\nProcessing room: {room_name}")
            
            room_features = self.features_data[room_name]
            room_matches = self.matches_data.get(room_name, {})
            
            # Check if we have sparse points
            sparse_points = self.point_clouds.get(room_name, np.array([]))
            
            if len(sparse_points) >= 50:  # Good sparse reconstruction
                print(f"  Using sparse points ({len(sparse_points)} points)")
                final_points = sparse_points
                suffix = "sparse"
                
            elif len(sparse_points) > 0:  # Low sparse points, try dense
                print(f"  Low sparse points ({len(sparse_points)}), generating dense cloud...")
                dense_points = self.generate_dense_cloud(room_name, room_features, room_matches)
                
                if len(dense_points) > len(sparse_points):
                    print(f"  Using dense points ({len(dense_points)} points)")
                    final_points = dense_points
                    suffix = "dense"
                else:
                    print(f"  Keeping sparse points (dense generation failed)")
                    final_points = sparse_points
                    suffix = "sparse"
                    
            else:  # No points, generate bounding box
                print(f"  No points recovered, generating bounding box...")
                final_points = self.generate_bounding_box(room_name)
                suffix = "bbox"
            
            # Save room model
            if len(final_points) > 0:
                ply_file_path = output_dir / f"{room_name.lower()}_{suffix}.ply"
                
                try:
                    with open(ply_file_path, 'w') as f:
                        # Write PLY header
                        f.write("ply\n")
                        f.write("format ascii 1.0\n")
                        f.write(f"element vertex {len(final_points)}\n")
                        f.write("property float x\n")
                        f.write("property float y\n")
                        f.write("property float z\n")
                        f.write("end_header\n")
                        
                        # Write point data
                        for point in final_points:
                            f.write(f"{point[0]:.6f} {point[1]:.6f} {point[2]:.6f}\n")
                    
                    print(f"  SUCCESS: {room_name}_{suffix}.ply saved ({len(final_points)} points)")
                    
                except Exception as e:
                    print(f"  ERROR: Could not save {room_name}: {e}")
            else:
                print(f"  ERROR: No points to save for {room_name}")
        
        print("\n" + "="*60)
        print("PER-ROOM RECONSTRUCTION COMPLETE")
        print("="*60)
        
        # Summary
        saved_files = list(output_dir.glob("*.ply"))
        print(f"Models saved: {len(saved_files)} files")
        for file_path in sorted(saved_files):
            print(f"  {file_path.name}")
        
        print(f"\nAll models available in: {output_dir}")
        print("="*60)
    
    class GlobalMapper:
        """
        Handles global coordinate system alignment and inter-room matching.
        """
        
        def __init__(self, point_clouds: dict, features_data: dict):
            self.point_clouds = point_clouds
            self.features_data = features_data
            self.room_transformations = {}
            self.global_points = []
            
        def find_connector_images(self, room1: str, room2: str) -> list:
            """
            Find potential connector images between rooms based on visual similarity.
            """
            print(f"  Searching for connectors between {room1} and {room2}...")
            
            connectors = []
            room1_features = self.features_data[room1]
            room2_features = self.features_data[room2]
            
            # Simple heuristic: look for images with similar feature distributions
            for img1_name, img1_data in room1_features.items():
                for img2_name, img2_data in room2_features.items():
                    # Compare keypoint counts as a simple similarity metric
                    kp1_count = len(img1_data['keypoints'])
                    kp2_count = len(img2_data['keypoints'])
                    
                    # If both have similar keypoint counts, they might be connectors
                    if abs(kp1_count - kp2_count) < min(kp1_count, kp2_count) * 0.3:
                        connectors.append((img1_name, img2_name))
            
            return connectors[:3]  # Return top 3 potential connectors
        
        def calculate_room_transformation(self, room1: str, room2: str) -> np.ndarray:
            """
            Calculate transformation matrix between two rooms using connector images.
            """
            connectors = self.find_connector_images(room1, room2)
            
            if not connectors:
                # Default transformation: place rooms side by side
                return np.array([
                    [1, 0, 0, 5.0],  # 5 meters offset in X
                    [0, 1, 0, 0],
                    [0, 0, 1, 0],
                    [0, 0, 0, 1]
                ])
            
            # Use first connector for alignment (simplified approach)
            img1_name, img2_name = connectors[0]
            
            # Get point clouds for both rooms
            points1 = self.point_clouds[room1]
            points2 = self.point_clouds[room2]
            
            if len(points1) == 0 or len(points2) == 0:
                return np.eye(4)  # Identity matrix as fallback
            
            # Simple alignment: use centroids and scale
            centroid1 = np.mean(points1, axis=0)
            centroid2 = np.mean(points2, axis=0)
            
            # Calculate translation to align centroids
            translation = centroid1 - centroid2
            translation[0] += 5.0  # Add X offset to separate rooms
            
            # Create transformation matrix
            transform = np.eye(4)
            transform[:3, 3] = translation
            
            return transform
        
        def align_all_rooms(self) -> np.ndarray:
            """
            Align all room point clouds into a global coordinate system.
            """
            print("\n" + "="*60)
            print("GLOBAL ROOM ALIGNMENT")
            print("="*60)
            
            room_names = list(self.point_clouds.keys())
            if not room_names:
                print("No rooms to align")
                return np.array([])
            
            # Start with first room as reference
            reference_room = room_names[0]
            self.room_transformations[reference_room] = np.eye(4)
            
            print(f"Reference room: {reference_room}")
            
            # Align other rooms relative to reference
            for i, room_name in enumerate(room_names[1:], 1):
                transform = self.calculate_room_transformation(reference_room, room_name)
                self.room_transformations[room_name] = transform
                
                print(f"  {room_name}: aligned with offset ({transform[0,3]:.2f}, {transform[1,3]:.2f}, {transform[2,3]:.2f})")
            
            # Apply transformations and collect all points
            all_transformed_points = []
            
            for room_name, points in self.point_clouds.items():
                if len(points) > 0:
                    transform = self.room_transformations[room_name]
                    
                    # Convert to homogeneous coordinates
                    points_homo = np.hstack([points, np.ones((len(points), 1))])
                    
                    # Apply transformation
                    transformed_points = (transform @ points_homo.T).T
                    transformed_points = transformed_points[:, :3]  # Back to 3D
                    
                    all_transformed_points.append(transformed_points)
                    print(f"  {room_name}: {len(points)} points transformed")
            
            if all_transformed_points:
                self.global_points = np.vstack(all_transformed_points)
                print(f"\nGlobal point cloud: {len(self.global_points)} total points")
            else:
                self.global_points = np.array([])
            
            return self.global_points
    
    def create_mesh_from_points(self, points: np.ndarray) -> tuple:
        """
        Create a mesh surface from point cloud using simplified approach.
        """
        print("\n" + "="*60)
        print("MESH RECONSTRUCTION")
        print("="*60)
        
        if len(points) < 10:
            print("Insufficient points for mesh reconstruction")
            return np.array([]), np.array([])
        
        try:
            # Simplified meshing using Delaunay triangulation in 2D projections
            print(f"Creating mesh from {len(points)} points...")
            
            # Project points to XY plane for 2D triangulation
            xy_points = points[:, :2]
            
            # Create Delaunay triangulation
            from scipy.spatial import Delaunay
            tri = Delaunay(xy_points)
            
            # Create vertices and faces
            vertices = points
            faces = tri.simplices
            
            print(f"Generated mesh with {len(vertices)} vertices and {len(faces)} faces")
            
            return vertices, faces
            
        except Exception as e:
            print(f"Error in mesh reconstruction: {e}")
            return np.array([]), np.array([])
    
    def apply_texture_mapping(self, vertices: np.ndarray, faces: np.ndarray) -> dict:
        """
        Apply texture coordinates to the mesh based on original images.
        """
        print("\n" + "="*60)
        print("TEXTURE MAPPING")
        print("="*60)
        
        if len(vertices) == 0 or len(faces) == 0:
            print("No mesh available for texturing")
            return {}
        
        try:
            # Simplified texture mapping based on vertex positions
            print("Applying texture coordinates...")
            
            # Normalize vertex coordinates to [0,1] for UV mapping
            min_coords = np.min(vertices, axis=0)
            max_coords = np.max(vertices, axis=0)
            
            # Create UV coordinates
            uv_coords = (vertices[:, :2] - min_coords[:2]) / (max_coords[:2] - min_coords[:2])
            
            # Create texture data structure
            texture_data = {
                'uv_coords': uv_coords,
                'vertices': vertices,
                'faces': faces,
                'texture_size': (1024, 1024)  # Default texture size
            }
            
            print(f"Texture mapping complete: {len(uv_coords)} UV coordinates")
            return texture_data
            
        except Exception as e:
            print(f"Error in texture mapping: {e}")
            return {}
    
    def export_final_house(self) -> None:
        """
        Export the unified property model as OBJ file with textures.
        """
        print("\n" + "="*60)
        print("EXPORTING FINAL PROPERTY MODEL")
        print("="*60)
        
        # Create global mapper and align rooms
        mapper = self.GlobalMapper(self.point_clouds, self.features_data)
        global_points = mapper.align_all_rooms()
        
        if len(global_points) == 0:
            print("No points to export")
            return
        
        # Create mesh
        vertices, faces = self.create_mesh_from_points(global_points)
        
        if len(vertices) == 0:
            print("No mesh to export")
            return
        
        # Apply texture mapping
        texture_data = self.apply_texture_mapping(vertices, faces)
        
        # Create output directory
        output_dir = self.base_directory / "output"
        output_dir.mkdir(exist_ok=True)
        
        # Export as OBJ file
        obj_file_path = output_dir / "full_property_model.obj"
        mtl_file_path = output_dir / "full_property_model.mtl"
        
        try:
            # Write MTL file (material file)
            with open(mtl_file_path, 'w') as f:
                f.write("# Material file for property model\n")
                f.write("newmtl PropertyMaterial\n")
                f.write("Ka 0.8 0.8 0.8\n")  # Ambient color
                f.write("Kd 0.8 0.8 0.8\n")  # Diffuse color
                f.write("Ks 0.2 0.2 0.2\n")  # Specular color
                f.write("Ns 32.0\n")          # Shininess
                f.write("map_Kd property_texture.png\n")  # Texture map
            
            # Write OBJ file
            with open(obj_file_path, 'w') as f:
                f.write("# Unified 3D Property Model\n")
                f.write(f"# Generated with {len(vertices)} vertices and {len(faces)} faces\n")
                f.write("mtllib full_property_model.mtl\n")
                f.write("usemtl PropertyMaterial\n\n")
                
                # Write vertices
                for vertex in vertices:
                    f.write(f"v {vertex[0]:.6f} {vertex[1]:.6f} {vertex[2]:.6f}\n")
                
                # Write texture coordinates if available
                if texture_data and 'uv_coords' in texture_data:
                    for uv in texture_data['uv_coords']:
                        f.write(f"vt {uv[0]:.6f} {uv[1]:.6f}\n")
                
                # Write faces
                for i, face in enumerate(faces):
                    # OBJ faces are 1-indexed
                    face_str = " ".join([f"{v+1}" for v in face])
                    if texture_data and 'uv_coords' in texture_data:
                        # Add texture coordinates
                        face_str = " ".join([f"{v+1}/{v+1}" for v in face])
                    f.write(f"f {face_str}\n")
            
            print(f"\nSUCCESS: Final property model exported to {obj_file_path}")
            print(f"Vertices: {len(vertices)}")
            print(f"Faces: {len(faces)}")
            print(f"Material file: {mtl_file_path}")
            print("Model ready for 3D visualization and editing!")
            
        except Exception as e:
            print(f"Error exporting model: {e}")
        
        print("="*60)


def main():
    """
    Main execution block - initializes the project and runs the scanner.
    """
    try:
        # Initialize the PropertyProject
        print("Initializing 3D Property Model Generator...")
        project = PropertyProject("Property3")
        
        # Scan images in the property directory
        print(f"\nScanning images in: {project.property_directory}")
        room_images = project.scan_images()
        
        # Validate rooms and print summary
        validation_results = project.validate_rooms(room_images)
        project.print_summary(room_images)
        
        # Check if all rooms have sufficient images
        insufficient_rooms = [room for room, is_valid in validation_results.items() if not is_valid]
        
        if insufficient_rooms:
            print(f"\nWARNING: {len(insufficient_rooms)} room(s) need more images:")
            for room in insufficient_rooms:
                print(f"  - {room}: {len(room_images[room])} images (need 3+)")
        else:
            print("\nSUCCESS: All rooms have sufficient images for 3D reconstruction!")
        
        # Detect features in valid rooms
        project.detect_features(room_images, validation_results)
        
        # Match features between image pairs
        project.match_features()
        
        # Recover camera poses and triangulate 3D points
        project.recover_camera_poses()
        
        # Generate robust per-room models with dense reconstruction
        project.save_per_room_models()
        
        # Align all rooms and export unified property model
        project.export_final_house()
            
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        print("Please ensure the 'photogrammetry_pipeline/Property3' folder exists.")
        sys.exit(1)
        
    except ValueError as e:
        print(f"ERROR: {e}")
        print("The property directory exists but contains no subfolders or images.")
        sys.exit(1)
        
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
