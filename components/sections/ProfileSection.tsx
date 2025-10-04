import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Check, X } from "lucide-react";
import { User } from "../../lib/types";
import { useTranslation } from "@/hooks/useTranslation";

interface ProfileSectionProps {
  currentUser: User | null;
  isEditing: boolean;
  editedName: string;
  setEditedName: (name: string) => void;
  editedAge: string;
  setEditedAge: (age: string) => void;
  editedGender: string;
  setEditedGender: (gender: string) => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
  isLoading: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  currentUser,
  isEditing,
  editedName,
  setEditedName,
  editedAge,
  setEditedAge,
  editedGender,
  setEditedGender,
  handleEdit,
  handleSave,
  handleCancel,
  isLoading,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle>{t("profile_settings")}</CardTitle>
          <CardDescription>
            {t("profile_manage")}
          </CardDescription>
        </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t("profile_name")}</label>
          <Input
            value={isEditing ? editedName : (currentUser?.name || "")}
            onChange={(e) => setEditedName(e.target.value)}
            className="mt-1"
            readOnly={!isEditing}
            placeholder={!isEditing ? t("profile_noName") : t("profile_enterName")}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">{t("profile_age")}</label>
            <Input
              type="number"
              min="13"
              max="25"
              value={isEditing ? editedAge : (currentUser?.age?.toString() || "")}
              onChange={(e) => setEditedAge(e.target.value)}
              className="mt-1"
              readOnly={!isEditing}
              placeholder={!isEditing ? t("profile_noAge") : t("profile_enterAge")}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t("profile_gender")}</label>
            {isEditing ? (
              <Select
                value={editedGender}
                onValueChange={setEditedGender}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t("profile_selectGender")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("auth_male")}</SelectItem>
                  <SelectItem value="female">{t("auth_female")}</SelectItem>
                  <SelectItem value="non-binary">{t("auth_nonBinary")}</SelectItem>
                  <SelectItem value="prefer-not-to-say">
                    {t("auth_preferNotToSay")}
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={currentUser?.gender || ""}
                className="mt-1"
                readOnly
                placeholder={t("profile_noGender")}
              />
            )}
          </div>
        </div>
        <div>
         
        </div>
        {!isEditing ? (
          <Button onClick={handleEdit} className="w-full">
            <Edit className="h-4 w-4 mr-2" />
            {t("profile_edit")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isLoading}
            >
              <Check className="h-4 w-4 mr-2" />
              {isLoading ? t("profile_saving") : t("profile_confirm")}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              {t("profile_cancel")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};
