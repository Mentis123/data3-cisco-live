import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Save, Download, Upload, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CategoryDefinition {
  key: string;
  displayName: string;
  blurb: string;
  aiDescriptionLong: string;
  aiKeywordsShort: string;
  icon: string;
  colorPrimary: string;
  colorLight: string;
}

const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    key: "NETWORKING",
    displayName: "Network Infrastructure & Connectivity",
    blurb: "Deliver reliable, high-performance connectivity that scales with business demands.",
    aiDescriptionLong: "Network infrastructure, switches, routers, SD-WAN, wireless networking, network automation, bandwidth optimization, network performance, Catalyst, Meraki, network segmentation, QoS",
    aiKeywordsShort: "Network infrastructure, switches, routers, SD-WAN, wireless, Catalyst, Meraki",
    icon: "🌐",
    colorPrimary: "#00BCF2",
    colorLight: "#78DCFF"
  },
  {
    key: "SECURITY",
    displayName: "Cybersecurity & Threat Protection",
    blurb: "Protect your organization with zero trust security and intelligent threat detection.",
    aiDescriptionLong: "Cybersecurity, firewalls, threat detection, identity management, zero trust, SASE, Secure Access Service Edge, security operations, compliance, endpoint protection, vulnerability management, Duo, Umbrella, SecureX",
    aiKeywordsShort: "Firewalls, threat detection, zero trust, identity, SASE, Duo, Umbrella, SecureX",
    icon: "🛡️",
    colorPrimary: "#6B21A8",
    colorLight: "#C4B5FD"
  },
  {
    key: "COLLABORATION",
    displayName: "Collaboration & Customer Experience",
    blurb: "Enable seamless communication and exceptional customer experiences across all channels.",
    aiDescriptionLong: "Team collaboration, unified communications, video conferencing, contact center, Webex, customer experience, customer service, messaging platforms, voice services, meeting solutions, hybrid work enablement",
    aiKeywordsShort: "Webex, contact center, unified communications, video, collaboration, customer experience",
    icon: "👥",
    colorPrimary: "#F97316",
    colorLight: "#FFB86B"
  },
  {
    key: "DATA_CENTRE",
    displayName: "Data Centre & Hybrid Cloud",
    blurb: "Build resilient infrastructure that bridges on-premises and cloud environments efficiently.",
    aiDescriptionLong: "Data centre infrastructure, cloud integration, virtualization, compute resources, storage systems, hyperconverged infrastructure, hybrid cloud solutions, UCS, HyperFlex, ACI, infrastructure automation, capacity planning",
    aiKeywordsShort: "Data centre, cloud, virtualization, compute, storage, UCS, HyperFlex, ACI",
    icon: "🏢",
    colorPrimary: "#059669",
    colorLight: "#86EFAC"
  }
];

const STORAGE_KEY = "category-migration-data";

export default function Migrate() {
  const [categories, setCategories] = useState<CategoryDefinition[]>(DEFAULT_CATEGORIES);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCategories(parsed);
        setSaved(true);
      } catch (e) {
        console.error("Failed to load stored categories:", e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    setSaved(true);
    toast({
      title: "Changes Saved",
      description: "Category definitions have been saved locally.",
    });
  };

  const handleReset = () => {
    if (confirm("Reset to default values? This will lose all your edits.")) {
      setCategories(DEFAULT_CATEGORIES);
      setSaved(false);
      localStorage.removeItem(STORAGE_KEY);
      toast({
        title: "Reset Complete",
        description: "Category definitions have been reset to defaults.",
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(categories, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "category-definitions.json";
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: "Category definitions downloaded as JSON.",
    });
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string);
            setCategories(imported);
            setSaved(false);
            toast({
              title: "Imported",
              description: "Category definitions imported. Don't forget to save!",
            });
          } catch (e) {
            toast({
              title: "Import Failed",
              description: "Invalid JSON file.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const updateCategory = (index: number, field: keyof CategoryDefinition, value: string) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setCategories(newCategories);
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Category Migration Editor
          </h1>
          <p className="text-slate-300 text-lg">
            Review and edit the 4 new category definitions. Changes are saved locally.
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-6 flex flex-wrap gap-3 items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
          <div className="flex gap-2 items-center">
            {saved && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Saved
              </Badge>
            )}
            {!saved && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleImport} variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import JSON
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Category Cards */}
        <div className="space-y-6">
          {categories.map((category, index) => (
            <Card key={category.key} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: category.colorPrimary }}
                  >
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-white text-2xl">
                      Category {index + 1}: {category.key}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Edit all fields for this category
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Key */}
                  <div>
                    <Label htmlFor={`key-${index}`} className="text-slate-300">
                      Category Key (Database)
                    </Label>
                    <Input
                      id={`key-${index}`}
                      value={category.key}
                      onChange={(e) => updateCategory(index, "key", e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">UPPERCASE_UNDERSCORE format</p>
                  </div>

                  {/* Icon */}
                  <div>
                    <Label htmlFor={`icon-${index}`} className="text-slate-300">
                      Icon (Emoji)
                    </Label>
                    <Input
                      id={`icon-${index}`}
                      value={category.icon}
                      onChange={(e) => updateCategory(index, "icon", e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white mt-1"
                      maxLength={2}
                    />
                    <p className="text-xs text-slate-500 mt-1">Single emoji character</p>
                  </div>

                  {/* Display Name */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`displayName-${index}`} className="text-slate-300">
                      Full Display Name
                    </Label>
                    <Input
                      id={`displayName-${index}`}
                      value={category.displayName}
                      onChange={(e) => updateCategory(index, "displayName", e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white mt-1"
                    />
                    <p className="text-xs text-slate-500 mt-1">Used on tiles, headers, How to Play page</p>
                  </div>

                  {/* Colors */}
                  <div>
                    <Label htmlFor={`colorPrimary-${index}`} className="text-slate-300">
                      Primary Color
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`colorPrimary-${index}`}
                        type="color"
                        value={category.colorPrimary}
                        onChange={(e) => updateCategory(index, "colorPrimary", e.target.value)}
                        className="w-16 h-10 p-1 bg-slate-900/50 border-slate-600"
                      />
                      <Input
                        value={category.colorPrimary}
                        onChange={(e) => updateCategory(index, "colorPrimary", e.target.value)}
                        className="flex-1 bg-slate-900/50 border-slate-600 text-white"
                        placeholder="#00BCF2"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Main category color</p>
                  </div>

                  <div>
                    <Label htmlFor={`colorLight-${index}`} className="text-slate-300">
                      Light Text Color
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={`colorLight-${index}`}
                        type="color"
                        value={category.colorLight}
                        onChange={(e) => updateCategory(index, "colorLight", e.target.value)}
                        className="w-16 h-10 p-1 bg-slate-900/50 border-slate-600"
                      />
                      <Input
                        value={category.colorLight}
                        onChange={(e) => updateCategory(index, "colorLight", e.target.value)}
                        className="flex-1 bg-slate-900/50 border-slate-600 text-white"
                        placeholder="#78DCFF"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Light variant for text</p>
                  </div>

                  {/* Blurb */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`blurb-${index}`} className="text-slate-300">
                      Short Blurb (One Sentence)
                    </Label>
                    <Textarea
                      id={`blurb-${index}`}
                      value={category.blurb}
                      onChange={(e) => updateCategory(index, "blurb", e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white mt-1"
                      rows={2}
                    />
                    <p className="text-xs text-slate-500 mt-1">Displayed on category selection cards</p>
                  </div>

                  {/* AI Description Long */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`aiDescLong-${index}`} className="text-slate-300">
                      AI Categorization Description (Long)
                    </Label>
                    <Textarea
                      id={`aiDescLong-${index}`}
                      value={category.aiDescriptionLong}
                      onChange={(e) => updateCategory(index, "aiDescriptionLong", e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white mt-1"
                      rows={3}
                    />
                    <p className="text-xs text-slate-500 mt-1">Comma-separated keywords for AI categorization</p>
                  </div>

                  {/* AI Keywords Short */}
                  <div className="md:col-span-2">
                    <Label htmlFor={`aiKeywords-${index}`} className="text-slate-300">
                      AI Validation Keywords (Short)
                    </Label>
                    <Textarea
                      id={`aiKeywords-${index}`}
                      value={category.aiKeywordsShort}
                      onChange={(e) => updateCategory(index, "aiKeywordsShort", e.target.value)}
                      className="bg-slate-900/50 border-slate-600 text-white mt-1"
                      rows={2}
                    />
                    <p className="text-xs text-slate-500 mt-1">Shorter list for AI scoring validation</p>
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <Label className="text-slate-300 mb-2 block">Preview</Label>
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: `${category.colorPrimary}20`,
                      borderLeft: `4px solid ${category.colorPrimary}`
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <h3
                        className="text-xl font-bold"
                        style={{ color: category.colorLight }}
                      >
                        {category.displayName}
                      </h3>
                    </div>
                    <p className="text-slate-300 text-sm">{category.blurb}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Instructions */}
        <Card className="mt-8 bg-blue-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-300">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <p>1. Review and edit all category definitions above</p>
            <p>2. Click "Save Changes" to store your edits locally</p>
            <p>3. (Optional) Export as JSON for backup</p>
            <p>4. Let me know when you're ready - I'll read the saved data and implement it across the codebase</p>
            <p className="text-sm text-slate-400 mt-4">
              💾 Data is stored in browser localStorage at key: <code className="bg-slate-800 px-2 py-1 rounded">{STORAGE_KEY}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
