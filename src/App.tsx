import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Carousel,
  GenerationCard,
  BattleArena,
  TeamBuilder,
  // BattleScreen not used in App itself
  BattlePage,
} from "./components";
import Login, { type AuthUser } from "./components/login/login";
import UserProfile from "./components/UserProfile/UserProfile";
import EditProfil from "./components/EditProfil/EditProfil";
import { GENERATIONS } from "./constants/generations";
import type { GenerationData, Pokemon } from "./types";
import { BattleProgressProvider } from "./contexts/BattleProgressContext";
import titreImage from "./assets/titre.png";
import "./App.css";

const API_URL = "http://localhost:3001";
const TOKEN_STORAGE_KEY = "authToken";
const USER_STORAGE_KEY = "authUser";

const isTokenExpired = (token: string) => {
  try {
    const payloadBase64 = token.split(".")[1];
    const payload = JSON.parse(atob(payloadBase64));

    if (!payload.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const removeStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

const readStoredSession = () => {
  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);

  if (!storedToken || !storedUser || isTokenExpired(storedToken)) {
    removeStoredSession();
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as AuthUser;
    return { token: storedToken, user: parsedUser };
  } catch {
    removeStoredSession();
    return null;
  }
};

function App() {
  const [session, setSession] = useState<{
    token: string;
    user: AuthUser;
  } | null>(() => readStoredSession());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationData | null>(null);
  const [buildingTeam, setBuildingTeam] = useState(false);
  const [teams, setTeams] = useState<Record<number, Pokemon[]>>({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const authToken = session?.token ?? null;
  const authUser = session?.user ?? null;

  const clearSession = () => {
    removeStoredSession();
    setSession(null);
  };

  const handleAuthSuccess = (token: string, user: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    setSession({ token, user });
  };

  const handleProfileUpdated = (updatedUser: AuthUser) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    if (session) {
      setSession({ ...session, user: updatedUser });
    }
  };

  useEffect(() => {
    if (!authToken) {
      return;
    }

    fetch(`${API_URL}/api/auth/verify`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          removeStoredSession();
          setSession(null);
        }
      })
      .catch(() => {
        removeStoredSession();
        setSession(null);
      });
  }, [authToken]);

  // charger dès le démarrage les équipes existantes pour chaque génération
  useEffect(() => {
    if (!authUser) {
      return;
    }

    const userId = authUser.id;
    const loadAll = async () => {
      const map: Record<number, Pokemon[]> = {};
      for (const gen of GENERATIONS) {
        try {
          const res = await fetch(
            `http://localhost:3001/api/teams/${userId}/${gen.generation}`,
          );
          if (res.ok) {
            const data = await res.json();
            map[gen.generation] = data.pokemonTeam || [];
          } else {
            map[gen.generation] = [];
          }
        } catch (err) {
          console.error("Erreur chargement équipe gen", gen.generation, err);
          map[gen.generation] = [];
        }
      }
      setTeams(map);
    };
    loadAll();
  }, [authUser]);

  const handleEnterArena = (generation: GenerationData) => {
    setSelectedGeneration(generation);
  };

  const handleBuildTeam = () => {
    setBuildingTeam(true);
  };

  const handleBackToArena = () => {
    // refetch équipe pour la génération actuelle au cas où elle a été modifiée
    if (selectedGeneration && authUser) {
      const userId = authUser.id;
      fetch(
        `http://localhost:3001/api/teams/${userId}/${selectedGeneration.generation}`,
      )
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("No team");
        })
        .then((data) => {
          setTeams((prev) => ({
            ...prev,
            [selectedGeneration.generation]: data.pokemonTeam || [],
          }));
        })
        .catch(() => {
          setTeams((prev) => ({
            ...prev,
            [selectedGeneration.generation]: [],
          }));
        });
    }
    setBuildingTeam(false);
  };

  const handleBackToCarousel = () => {
    setSelectedGeneration(null);
    setBuildingTeam(false);
  };

  // this inner component will handle rendering based on state
  const MainContent = () => {
    if (!authToken || !authUser) {
      return <Login onAuthSuccess={handleAuthSuccess} />;
    }

    if (buildingTeam && selectedGeneration) {
      return (
        <TeamBuilder
          generation={selectedGeneration}
          onBackToArena={handleBackToArena}
          preFilledTeam={teams[selectedGeneration.generation] || []}
          authUser={authUser}
        />
      );
    }

    if (selectedGeneration) {
      return (
        <BattleArena
          generation={selectedGeneration}
          onBackToCarousel={handleBackToCarousel}
          onBuildTeam={handleBuildTeam}
          userLevel={authUser?.niveau}
          userUsername={authUser?.username}
          authToken={authToken || undefined}
          onProfileUpdated={handleProfileUpdated}
          userTeam={teams[selectedGeneration.generation] || []}
        />
      );
    }

    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header-top">
            <img
              src={titreImage}
              alt="Pokemon Rogue League"
              className="app-title-image"
              draggable={false}
            />
            <UserProfile
              user={authUser}
              onLogout={clearSession}
              onEditClick={() => setIsEditingProfile(true)}
            />
          </div>
          {/* <p className="app-subtitle">
            Choose your generation and prove your worth!
          </p> */}
        </header>

        {isEditingProfile && authToken && (
          <EditProfil
            user={authUser}
            token={authToken}
            onClose={() => setIsEditingProfile(false)}
            onProfileUpdated={handleProfileUpdated}
          />
        )}

        <Carousel
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        userLevel={authUser?.niveau}
      >
        {GENERATIONS.map((gen: GenerationData) => (
          <GenerationCard
            key={gen.generation}
            generation={gen}
            team={teams[gen.generation] || []}
            onEnterArena={() => handleEnterArena(gen)}
            userLevel={authUser?.niveau}
          />
        ))}
      </Carousel>
    </div>
  );
};

  // top level return includes router and provider
  return (
    <BrowserRouter>
      <BattleProgressProvider userId={authUser?.id}>
        <Routes>
          <Route
            path="/battle/:gen/:dresseurId"
            element={
              <BattlePage authUser={authUser || undefined} />
            }
          />
          <Route path="/*" element={<MainContent />} />
        </Routes>
      </BattleProgressProvider>
    </BrowserRouter>
  );
}

export default App;
