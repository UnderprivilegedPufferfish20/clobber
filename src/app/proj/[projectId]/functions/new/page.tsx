"use client";

import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EdgeFunctionType } from "@/lib/types";
import CodeMirrorReact from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { ArrowLeftIcon, ArrowRightIcon, Edit2Icon, EditIcon, EllipsisVerticalIcon, FileIcon, FilePlus2Icon, Trash2Icon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadEdgeFunction } from "@/lib/actions/functions/actions";
import { toast } from "sonner";

export default function CreateEdgeFunctionPage({
    
}: {
    
}) {
    const pathname = usePathname()
    const router = useRouter()

    const projectId = pathname.split("/")[2]

    const [edgeFunc, setEdgeFunc] = useState<EdgeFunctionType>({
        created_at: "",
        deployment_count: 0,
        files: [ 
            { name: "index.js", 
            code: `const functions = require('@google-cloud/functions-framework');

            // Register an HTTP function
            functions.http('yourFunctionName', (req, res) => {
            // Your logic here
            res.send('Hello World!');
            });` 
        } ],
        slug: '',
        updated_at: "",
        entry_point_function_name: "",
        url: ""
    })

    const [selectedFile, setSelectedFile] = useState<{ name: string, code: string }>({ 
        name: "index.js", 
        code: `const functions = require('@google-cloud/functions-framework');

  // Register an HTTP function
functions.http('yourFunctionName', (req, res) => {
  // Your logic here
  res.send('Hello World!');
});
        ` 
    })

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newFileName, setNewFileName] = useState("")

    const [isDoubleExport, setIsDoubleExport] = useState(true)
    const [isNoExport, setIsNoExport] = useState(true)


    const currentFileNames = useMemo(() => {
        return new Set(edgeFunc.files.map(f => f.name.split(".")[0]))
    }, [edgeFunc.files])

    const { theme } = useTheme()

    const cmTheme = theme === "dark" ? githubDark : githubLight;

    const AddFileAction= () => {
        setEdgeFunc(prev => ({
            ...prev,
            files: [...prev.files, { name: `${newFileName}.js`, code: "" }]
        }));
        setNewFileName(""); // Reset input
        setIsCreateDialogOpen(false)
    }

    const prevFilesLengthRef = useRef(1);

    useEffect(() => {
        if (selectedFile) return;
        setSelectedFile({ name: "index.js", code: "" })
    })

    useEffect(() => {
        if (edgeFunc.files.length > prevFilesLengthRef.current) {
            setSelectedFile(edgeFunc.files.at(-1)!);
        }
        prevFilesLengthRef.current = edgeFunc.files.length;
    }, [edgeFunc.files])

    const { mutate: deploy } = useMutation({
        mutationFn: () => uploadEdgeFunction(edgeFunc, projectId),
        onSuccess: () => {
            toast.success("Function Deployed", { id: "create-edge-func" })
            setIsDeploying(false)
        },
        onError: (e) => {
            toast.error(`Failed to deploy: ${e}`, { id: "create-edge-func" });
            setIsDeploying(false)
        },
        onMutate: () => {
            toast.loading("Deploying... (This could take up to 5 minutes)", { id: "create-edge-func" })
            setIsDeploying(true)
        },
    })

    const [isDeploying, setIsDeploying] = useState(false)

    useEffect(() => {
        if (selectedFile.name !== "index.js") return;

        const matches = selectedFile.code.match(/\bexport\b/g);
        const count = matches ? matches.length : 0;

        if (count > 1) {
            setIsDoubleExport(true)
        } else {
            if (count === 0) {
                setIsDoubleExport(false)
                setIsNoExport(true)
            } else {
                setIsDoubleExport(false)
                setIsNoExport(false)
            }
        }

    }, [selectedFile])

    const [entryPointFuncName, setEntryPointFuncName] = useState("")

    useEffect(() => {
        if (selectedFile.name !== "index.js") return;

        const code = selectedFile.code;

        // Regex to match exactly one functions.http('name', ...) pattern
        // @ts-ignore
        const functionsHttpRegex = /functions\.http\(['"](?<name>\w+)['"],/;
        
        const match = code.match(functionsHttpRegex);

        console.log(`@MATCH: `, match?.groups)
        
        if (match?.groups?.name) {

            setEdgeFunc(p => ({ ...p, entry_point_function_name: match.groups!.name }));
            
            // Check if there's exactly one such pattern
            const allMatches = code.match(/functions\.http\(/g) || [];
            console.log("@ALLMATCHES: ", allMatches)
            setIsNoExport(allMatches.length === 0);
            setIsDoubleExport(allMatches.length > 1);
        } else {
            setEdgeFunc(p => ({ ...p, entry_point_function_name: "" }));
            setIsNoExport(true);
            setIsDoubleExport(false);
        }
        }, [selectedFile]);



    useEffect(() => {
        if (!isDoubleExport) {
            toast.dismiss("double-export-error")
            return;
        }

        toast.error("The \"index.js\" file can only have one exported http function that acts as the entry point", {
            duration: Infinity,
            id: "double-export-error",
            className: "w-[564px] min-w-[564px] max-w-[564px]",
            position: "bottom-center"
            
        })
    }, [isDoubleExport])

    useEffect(() => {
        if (!isNoExport) {
            toast.dismiss("no-export-error")
            return;
        }

        toast.error("The \"index.js\" file must export a function to act as the entry point", {
            duration: Infinity,
            id: "no-export-error",
            className: "w-[564px] min-w-[564px] max-w-[564px]",
            position: "bottom-center"
            
        })
    }, [isNoExport])



    return (
        <>
            <div className="fullscreen flex-1 flex">
                <aside className="dark:bg-white/5 bg-white flex flex-col border-r-2 w-1/6 min-w-1/6 max-w-1/6">
                    <div className="flex items-center gap-2 text-sm p-4">
                        <ArrowLeftIcon

                            onClick={() => !isDeploying && router.back()}
                            className="cursor-pointer h-4 w-4"
                        />
                        <h3 className="text-xl">Create Edge Function</h3>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-4">
                        <h1 className="text-2xl">Files</h1>
                        <Button
                            variant={"outline"}
                            className="flex items-center gap-2"
                            disabled={isDeploying}
                            onClick={() => setIsCreateDialogOpen(true)}
                        >

                            <FilePlus2Icon className="w-8 h-8"/>
                            Add File
                        </Button>
                    </div>
                    {edgeFunc.files.map((e, index) => {
                        return (
                            <SidebarFile
                                isDeploying={isDeploying} 
                                func={e}
                                index={index}
                                selectedFile={selectedFile}
                                setEdgeFunc={setEdgeFunc}
                                setSelectedFile={setSelectedFile}
                                key={e.name}
                                currentFileNames={currentFileNames}
                                edgeFunc={edgeFunc}
                            />
                        )
                    })}
                </aside>
                <div className="flex flex-col flex-1">
                    <header className="flex items-center justify-between p-4 h-15 min-h-15 max-h-15 dark:bg-white/5 bg-white">
                        <div className="flex items-center gap-2">
                            <h1>Name:</h1>
                            <Input
                                disabled={isDeploying} 
                                value={edgeFunc.slug}
                                onChange={e => setEdgeFunc(p => ({...p, slug: e.target.value }))}
                                placeholder="hello-world"
                                className="w-36 min-w-36 max-w-36"
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            
                            <Button

                                onClick={() => deploy()}
                                disabled={!edgeFunc.slug || isDeploying || isDoubleExport} 
                                variant={"default"}
                                className="flex items-center group gap-2 p-4 bg-indigo-500 hover:bg-indigo-600 transition-colors duration-300"
                            >
                                <h1 className="text-white">Deploy Function</h1>
                                <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform duration-300 stroke-white"/>
                            </Button>
                        </div>

                    </header>
                    <div className="flex-1 overflow-hidden min-h-0 min-w-0">
                        <CodeMirrorReact
                            readOnly={isDeploying}
                            key={selectedFile.name} // Force re-mount when file changes
                            height="100%"
                            value={selectedFile.code}
                            theme={cmTheme}
                            extensions={[javascript({ jsx: true })]}
                            onChange={(value: string) => {
                                const newCode = value ?? "";
                                setSelectedFile(prev => ({ ...prev, code: newCode }));
                                
                                setEdgeFunc(prev => ({
                                    ...prev,
                                    files: prev.files.map(f => 
                                        f.name === selectedFile.name ? { ...f, code: newCode } : f
                                    )
                                }));
                            }}
                            basicSetup={{
                                lineNumbers: true,
                                highlightActiveLine: true,
                                bracketMatching: true,
                                syntaxHighlighting: true,
                            }}

                        />
                    </div>
                </div>


            </div>

            <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            >
                <DialogContent>
                    <CustomDialogHeader 
                        icon={FilePlus2Icon}
                        title="Add file to edge function"
                    />

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" >Name</Label>
                        <Input
                            className={`${currentFileNames.has(newFileName) && "border border-red-500! focus:border-red-500! focus:ring-red-500! rounded-md p-2"}`}
                            value={newFileName}
                            onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                AddFileAction()
                            }
                            }}
                            onChange={e => setNewFileName(e.target.value)} 
                            id="name"
                        />
                        {currentFileNames.has(newFileName) && (
                            <p className="text-md text-red-400">File with that name already exists</p>
                        )}
                        {newFileName.includes(".") && (
                            <p className="text-md text-red-400">All files are javascript (.js) and cannot contain dots</p>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                        <Button
                            variant={'outline'}
                        >
                            Cancel
                        </Button>
                        </DialogClose>

                        <Button
                            onClick={AddFileAction}
                            disabled={currentFileNames.has(newFileName) || newFileName.includes(".")}
                        >
                            Create File
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}


function SidebarFile({
    selectedFile,
    setSelectedFile,


    func,

    edgeFunc,
    setEdgeFunc,
    currentFileNames,
    index,
    isDeploying
}: {
    selectedFile: { name: string, code: string },
    currentFileNames: Set<string>,
    func: { name: string, code: string },
    setSelectedFile: Dispatch<SetStateAction<{ name: string, code: string }>>
    setEdgeFunc: Dispatch<SetStateAction<EdgeFunctionType>>,
    edgeFunc: EdgeFunctionType,
    index: number,
    isDeploying: boolean
}) {

    const [renameOpen, setRenameOpen] = useState(false)
    const [newName, setNewName] = useState("")

    const renameFileAction = () => {
        setEdgeFunc(prev => {
            // Map creates a new array (immutability)
            const updatedFiles = prev.files.map((file, idx) => {
                if (idx !== index) return file;
                
                // Return a new object for the renamed file
                return { ...file, name: `${newName}.js` };
            });

            return { ...prev, files: updatedFiles };
        });

        // 3. Keep selectedFile in sync if the file being renamed is the active one
        if (selectedFile.name === func.name) {
            setSelectedFile(prev => ({ ...prev, name: `${newName}.js` }));
        }

        setNewName("");
        setRenameOpen(false);
    };



    return (
        <>
        
            <div 
                onClick={() => {
                    setSelectedFile({ name: func.name, code: func.code })
                }}
                className={`hover:bg-black/3 cursor-pointer dark:hover:bg-white/3 gap-2 flex items-center p-2 justify-between ${func.name === selectedFile.name && "dark:bg-white/10 bg-black/10 border-l-4 border-indigo-400"}`}
            >
                <div className="flex items-center gap-4">
                    <FileIcon className="w-6 h-6"/>
                    <h2>{func.name}</h2>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <EllipsisVerticalIcon className={`w-4 h-4 ${func.name === 'index.js' && "hidden"}`}/>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={(e) => {
                                if (!isDeploying) {
                                    e.stopPropagation()
                                    setRenameOpen(true)
                                }
                            }}
                        >
                            <EditIcon className="w-6 h-6"/>
                            Rename
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem 
                            className="flex items-center gap-2"
                            onClick={() => {
                                if (isDeploying) return;
                                setEdgeFunc(prev => ({
                                    ...prev,
                                    files: prev.files.filter((_, idx) => idx !== index)
                                }));
                            }}
                        >
                            <Trash2Icon className="w-6 h-6"/>
                            Delete
                        </DropdownMenuItem>
     
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Dialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
            >   
                <DialogContent>
                    <CustomDialogHeader 
                        icon={Edit2Icon}
                        title={`Rename ${func.name}`}
                    />

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" >New Name</Label>
                        <Input
                            className={`${currentFileNames.has(newName) && "border border-red-500! focus:border-red-500! focus:ring-red-500! rounded-md p-2"}`}
                            value={newName}
                            onKeyDown={e => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                renameFileAction()
                            }
                            }}
                            onChange={e => setNewName(e.target.value)} 
                            id="name"
                        />
                        {currentFileNames.has(newName) && (
                            <p className="text-md text-red-400">File with that name already exists</p>
                        )}
                        {newName.includes(".") && (
                            <p className="text-md text-red-400">All files are javascript (.js) and cannot contain dots</p>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                        <Button
                            variant={'outline'}
                        >
                            Cancel
                        </Button>
                        </DialogClose>

                        <Button
                            onClick={renameFileAction}
                            disabled={currentFileNames.has(newName) || newName.includes(".")}
                        >
                            Rename
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}