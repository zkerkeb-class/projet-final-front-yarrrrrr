import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { type AuthUser } from "../login/login";
import "./UserProfile.css";

interface UserProfileProps {
	user: AuthUser;
	onLogout: () => void;
	onEditClick: () => void;
}

const API_URL = "http://localhost:3001";

export default function UserProfile({
	user,
	onLogout,
	onEditClick,
}: UserProfileProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const handleMenuToggle = () => {
		setIsMenuOpen(!isMenuOpen);
	};

	const handleLogout = () => {
		setIsMenuOpen(false);
		onLogout();
	};

	const handleEdit = () => {
		setIsMenuOpen(false);
		onEditClick();
	};

	return (
		<div className="user-profile">
			<button
				className="avatar-button"
				onClick={handleMenuToggle}
				aria-label="Menu profil"
				title={user.username}
			>
				<img
					src={user.photoProfil[0] || `${API_URL}/assets/avatar/1.png`}
					alt={user.username}
				/>
			</button>

			{isMenuOpen && (
				<div className="profile-menu">
					<button
						className="menu-item edit-item"
						onClick={handleEdit}
						title="Éditer le profil"
					>
						<FontAwesomeIcon icon={faEdit} />
					</button>
					<button
						className="menu-item logout-item"
						onClick={handleLogout}
						title="Se déconnecter"
					>
						<FontAwesomeIcon icon={faArrowRightFromBracket} />
					</button>
				</div>
			)}
		</div>
	);
}
