import { HouseholdInfo, PersonalInfo } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface PersonalInfoFormProps {
  data: {
    household: HouseholdInfo;
  };
  onUpdate: (household: HouseholdInfo) => void;
}

export default function PersonalInfoForm({ data, onUpdate }: PersonalInfoFormProps) {
  const { household } = data;
  const currentYear = new Date().getFullYear();

  const handleUserChange = (field: keyof PersonalInfo, value: any) => {
    onUpdate({
      ...household,
      user: {
        ...household.user,
        [field]: typeof value === 'string' ? value : Number(value),
      },
    });
  };

  const handleSpouseChange = (field: keyof PersonalInfo, value: any) => {
    if (!household.spouse) return;
    onUpdate({
      ...household,
      spouse: {
        ...household.spouse,
        [field]: typeof value === 'string' ? value : Number(value),
      },
    });
  };

  const addSpouse = () => {
    onUpdate({
      ...household,
      spouse: {
        name: 'Spouse',
        birthYear: 1975,
        retirementAge: 65,
        lifeExpectancyAge: 92,
      },
    });
  };

  const removeSpouse = () => {
    onUpdate({
      ...household,
      spouse: undefined,
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* User Information */}
      <div className="card">
        <div className="card-header">Your Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={household.user.name}
              onChange={(e) => handleUserChange('name', e.target.value)}
              className="w-full"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Birth Year</label>
            <input
              type="number"
              value={household.user.birthYear}
              onChange={(e) => handleUserChange('birthYear', e.target.value)}
              className="w-full"
            />
            <div className="form-hint">
              Current age: {currentYear - household.user.birthYear}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Retirement Age</label>
            <input
              type="number"
              value={household.user.retirementAge}
              onChange={(e) => handleUserChange('retirementAge', e.target.value)}
              min={50}
              max={80}
              className="w-full"
            />
            <div className="form-hint">
              Retirement year: {household.user.birthYear + household.user.retirementAge}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Life Expectancy Age</label>
            <input
              type="number"
              value={household.user.lifeExpectancyAge}
              onChange={(e) => handleUserChange('lifeExpectancyAge', e.target.value)}
              min={household.user.retirementAge}
              max={120}
              className="w-full"
            />
            <div className="form-hint">
              Expected year: {household.user.birthYear + household.user.lifeExpectancyAge}
            </div>
          </div>
        </div>
      </div>

      {/* Spouse Information */}
      {household.spouse ? (
        <div className="card">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-navy-700">
            <h3 className="card-header text-base mb-0">Spouse Information</h3>
            <button
              onClick={removeSpouse}
              className="btn-danger text-sm flex items-center gap-2"
            >
              <Trash2 size={16} />
              Remove Spouse
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={household.spouse.name}
                onChange={(e) => handleSpouseChange('name', e.target.value)}
                className="w-full"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Birth Year</label>
              <input
                type="number"
                value={household.spouse.birthYear}
                onChange={(e) => handleSpouseChange('birthYear', e.target.value)}
                className="w-full"
              />
              <div className="form-hint">
                Current age: {currentYear - household.spouse.birthYear}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Retirement Age</label>
              <input
                type="number"
                value={household.spouse.retirementAge}
                onChange={(e) => handleSpouseChange('retirementAge', e.target.value)}
                min={50}
                max={80}
                className="w-full"
              />
              <div className="form-hint">
                Retirement year: {household.spouse.birthYear + household.spouse.retirementAge}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Life Expectancy Age</label>
              <input
                type="number"
                value={household.spouse.lifeExpectancyAge}
                onChange={(e) => handleSpouseChange('lifeExpectancyAge', e.target.value)}
                min={household.spouse.retirementAge}
                max={120}
                className="w-full"
              />
              <div className="form-hint">
                Expected year: {household.spouse.birthYear + household.spouse.lifeExpectancyAge}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <button
            onClick={addSpouse}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add Spouse Information
          </button>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
        <h4 className="font-medium text-blue-200 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-300 space-y-1">
          <li>• Life expectancy is crucial - it determines how long your portfolio needs to last</li>
          <li>• Your retirement age determines when active income stops</li>
          <li>• All projections will automatically scale to your life expectancy timeline</li>
          <li>• Update your spouse information if planning jointly</li>
        </ul>
      </div>
    </div>
  );
}
